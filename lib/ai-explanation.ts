/**
 * AI 설명 생성 모듈 (Google Gemini)
 * 
 * PRD: AI는 추천 결과를 입력값으로 받아
 * 사용자의 취향과 향수 노트 간의 관계를 설명하는 역할만 수행
 * 
 * 비용 절감:
 * - gemini-2.0-flash-exp 모델 사용 (빠르고 저렴)
 * - maxTokens: 1000으로 제한 (간결한 응답)
 * - 토큰 사용량 로깅
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

export interface ExplanationInput {
  userPreferences: {
    preferredNotes: string[];
    dislikedNotes: string[];
    usageContext: string[];
  };
  perfume: {
    name: string;
    brand?: string;
    notes: string[];
    family: string;
    mood: string;
  };
  recommendation: {
    verdict: 'recommend' | 'not_recommend';
    score: number;
    reasons: string[];
  };
}

export interface ExplanationOutput {
  summary: string;
  fullText: string;
  model: string;
  promptVersion: string;
  tokensUsed?: number;
}

/**
 * Gemini API를 사용하여 AI 설명 생성
 * 
 * @throws Error - API 키 없음, Quota 초과, 네트워크 오류 등
 */
export async function generateExplanation(
  input: ExplanationInput
): Promise<ExplanationOutput> {
  // 1. API 키 검증
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_GENERATIVE_AI_API_KEY is not configured');
  }

  // 2. Gemini 클라이언트 초기화
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
    generationConfig: {
      maxOutputTokens: 1000, // 비용 절감: 최대 1000 토큰
      temperature: 0.7, // 논리적이면서도 자연스러운 설명
    },
  });

  // 3. 프롬프트 구성
  const prompt = buildPrompt(input);

  console.log('[AI Explanation] Prompt prepared');
  console.log('[AI Explanation] Estimated input tokens:', estimateTokens(prompt));

  // 4. API 호출
  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    console.log('[AI Explanation] Response received');
    console.log('[AI Explanation] Output tokens (estimated):', estimateTokens(text));

    // 5. 응답 파싱 (summary와 fullText 분리)
    const { summary, fullText } = parseResponse(text);

    return {
      summary,
      fullText,
      model: 'gemini-2.0-flash-exp',
      promptVersion: 'v1',
      tokensUsed: estimateTokens(prompt) + estimateTokens(text),
    };
  } catch (error: unknown) {
    // 6. 에러 처리
    console.error('[AI Explanation] Error:', error);

    // Quota Exceeded 에러 특별 처리
    if (error instanceof Error) {
      if (error.message.includes('quota') || error.message.includes('429')) {
        throw new Error('QUOTA_EXCEEDED');
      }
      if (error.message.includes('API key')) {
        throw new Error('INVALID_API_KEY');
      }
    }

    throw new Error('AI_GENERATION_FAILED');
  }
}

/**
 * 프롬프트 생성
 * 
 * PRD 원칙:
 * - AI는 판단하지 않고 설명만 함
 * - 확률적 표현 금지 ("아마도", "~일 것 같아요")
 * - 논리적이고 친절한 톤
 */
function buildPrompt(input: ExplanationInput): string {
  const { userPreferences, perfume, recommendation } = input;

  const preferredList = userPreferences.preferredNotes.join(', ') || '없음';
  const dislikedList = userPreferences.dislikedNotes.join(', ') || '없음';
  const usageList = userPreferences.usageContext.join(', ') || '없음';
  const notesList = perfume.notes.join(', ');
  const verdictText = recommendation.verdict === 'recommend' ? '추천' : '비추천';
  const reasonsList = recommendation.reasons.join('\n- ');

  return `
당신은 향수 추천 전문가입니다. 규칙 기반 추천 시스템이 내린 판정을 사용자에게 설명하는 역할을 합니다.

**중요한 규칙:**
1. 이미 결정된 추천 결과를 설명만 하세요. 새로운 판단을 내리지 마세요.
2. 확률적 표현 금지: "아마도", "~일 것 같아요", "추천드려요" 사용 금지
3. 논리적이고 친절한 톤 유지
4. 간결하게 작성 (최대 1000 토큰)

---

**사용자 취향:**
- 선호 노트: ${preferredList}
- 비선호 노트: ${dislikedList}
- 사용 상황: ${usageList}

**향수 정보:**
- 이름: ${perfume.name}
${perfume.brand ? `- 브랜드: ${perfume.brand}` : ''}
- 노트: ${notesList}
- 계열: ${perfume.family}
- 분위기: ${perfume.mood}

**추천 판정:** ${verdictText} (점수: ${recommendation.score}점)

**판정 이유:**
- ${reasonsList}

---

위 정보를 바탕으로 다음 형식으로 설명을 작성하세요:

**[요약]**
(1-2문장으로 핵심만 간결하게)

**[상세 설명]**
(3-5문장으로 취향과 향수 노트 간의 관계를 논리적으로 설명)
`.trim();
}

/**
 * AI 응답 파싱
 * 
 * [요약]과 [상세 설명]을 분리
 */
function parseResponse(text: string): { summary: string; fullText: string } {
  const summaryMatch = text.match(/\[요약\]\s*\n([\s\S]*?)(?=\n\[상세 설명\]|\n\*\*\[상세 설명\]|$)/);
  const fullTextMatch = text.match(/\[상세 설명\]\s*\n([\s\S]*)/);

  let summary = summaryMatch ? summaryMatch[1].trim() : '';
  let fullText = fullTextMatch ? fullTextMatch[1].trim() : '';

  // [요약], [상세 설명] 헤더를 찾지 못한 경우 전체를 fullText로 사용
  if (!summary && !fullText) {
    // 첫 문단을 요약으로, 나머지를 상세 설명으로 분리
    const paragraphs = text.split('\n\n');
    summary = paragraphs[0] || text.substring(0, 200);
    fullText = paragraphs.slice(1).join('\n\n') || text;
  }

  // 빈 값 방지
  if (!summary) {
    summary = fullText.substring(0, 200);
  }
  if (!fullText) {
    fullText = text;
  }

  return {
    summary: summary.replace(/^\*\*|\*\*$/g, '').trim(),
    fullText: fullText.replace(/^\*\*|\*\*$/g, '').trim(),
  };
}

/**
 * 토큰 수 추정 (대략적인 계산)
 * 
 * 영어: ~4자 = 1토큰
 * 한글: ~2자 = 1토큰 (더 효율적)
 */
function estimateTokens(text: string): number {
  const koreanChars = (text.match(/[\u3131-\uD79D]/g) || []).length;
  const otherChars = text.length - koreanChars;
  
  return Math.ceil(koreanChars / 2 + otherChars / 4);
}
