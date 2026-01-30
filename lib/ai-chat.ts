/**
 * AI 챗봇 로직 (Google Gemini / Groq)
 * 
 * 목적: 사용자 질문에 대한 AI 답변 생성
 * 
 * 비용 최적화:
 * - maxTokens: 300 제한 (간결한 응답)
 * - Flash 계열 모델 사용 (빠르고 저렴)
 * - 시스템 프롬프트로 핵심만 간결하게 답변하도록 유도
 * 
 * SDK 사용:
 * - Google: @google/generative-ai (공식 SDK, lib/ai-explanation.ts와 동일)
 * - Groq: @ai-sdk/groq (Vercel AI SDK)
 */

import { generateText } from 'ai';
import { groq } from '@ai-sdk/groq';
import { GoogleGenerativeAI } from '@google/generative-ai';

export type AIProvider = 'google' | 'groq';

export interface ChatInput {
  prompt: string;
  provider: AIProvider;
}

export interface ChatOutput {
  response: string;
  provider: AIProvider;
  latencyMs: number;
  tokensUsed?: number;
}

/**
 * AI 챗봇 답변 생성
 * 
 * @throws Error - API 키 없음, Quota 초과, 네트워크 오류 등
 */
export async function generateChatResponse(input: ChatInput): Promise<ChatOutput> {
  // Provider별 분기 처리 (각 provider는 다른 SDK 사용)
  if (input.provider === 'google') {
    return generateGoogleResponse(input);
  } else if (input.provider === 'groq') {
    return generateGroqResponse(input);
  } else {
    throw new Error(`Unsupported provider: ${input.provider}`);
  }
}

/**
 * Google Gemini 답변 생성 (@google/generative-ai SDK 사용)
 * 
 * Fallback chain을 통해 사용 가능한 모델 자동 선택
 */
async function generateGoogleResponse(input: ChatInput): Promise<ChatOutput> {
  const startTime = Date.now();

  // 1. API 키 검증
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_API_KEY_MISSING');
  }

  // 2. Gemini 클라이언트 초기화
  const genAI = new GoogleGenerativeAI(apiKey);
  
  // 3. Fallback chain: 우선순위대로 시도
  const modelCandidates = [
    'gemini-2.0-flash',         // 1순위: 최신 2.0
    'gemini-1.5-flash-latest',  // 2순위: 1.5 latest
    'gemini-1.5-flash',         // 3순위: 1.5 안정 버전
  ];

  console.log(`[AI Chat] ========================================`);
  console.log(`[AI Chat] Provider: google`);
  console.log(`[AI Chat] SDK: @google/generative-ai (공식 SDK)`);
  console.log(`[AI Chat] Fallback chain: ${modelCandidates.join(' → ')}`);

  // 4. Fallback chain으로 모델 시도
  let lastError: Error | null = null;
  
  for (const modelName of modelCandidates) {
    try {
      console.log(`[AI Chat] 🔄 Trying model: ${modelName}`);
      
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          maxOutputTokens: 300, // 챗봇은 간결하게
          temperature: 0.7,
        },
      });

      // 프롬프트 구성 (시스템 프롬프트 포함)
      const prompt = `당신은 친절하고 정확한 AI 어시스턴트입니다.

중요한 규칙:
- 핵심만 간결하게 답변하세요 (최대 300 토큰)
- 불필요한 인사말이나 긴 서론은 생략하세요
- 사용자의 질문에 직접적으로 답변하세요
- 모르는 내용은 솔직하게 "잘 모르겠습니다"라고 답하세요

질문: ${input.prompt}`;

      // API 호출
      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      const latencyMs = Date.now() - startTime;

      // 성공!
      console.log(`[AI Chat] ✅ SUCCESS with model: ${modelName}`);
      console.log(`[AI Chat] Latency: ${latencyMs}ms`);
      console.log(`[AI Chat] Tokens used (estimated): ${estimateTokens(text)}`);
      console.log(`[AI Chat] ========================================`);

      return {
        response: text,
        provider: 'google',
        latencyMs,
        tokensUsed: estimateTokens(text),
      };
    } catch (error: unknown) {
      // 이 모델은 실패, 다음 모델 시도
      console.log(`[AI Chat] ❌ Failed with model: ${modelName}`);
      
      if (error instanceof Error) {
        console.log(`[AI Chat]    Reason: ${error.message.substring(0, 100)}...`);
        lastError = error;

        const errorMsg = error.message.toLowerCase();
        
        // Quota/API Key 문제는 모델 변경으로 해결 불가 → 즉시 throw
        if (errorMsg.includes('quota') || errorMsg.includes('429') || errorMsg.includes('resource_exhausted')) {
          console.error('[AI Chat] 🚫 Quota exceeded - stopping fallback chain');
          throw new Error('QUOTA_EXCEEDED');
        }
        
        if (errorMsg.includes('api key') || errorMsg.includes('unauthorized')) {
          console.error('[AI Chat] 🚫 Invalid API key - stopping fallback chain');
          throw new Error('INVALID_API_KEY');
        }
      }
      
      // 다음 모델 시도
      continue;
    }
  }

  // 모든 모델 실패
  console.error('[AI Chat] ========== ALL MODELS FAILED ==========');
  console.error('[AI Chat] Tried models:', modelCandidates.join(', '));
  console.error('[AI Chat] Last error:', lastError);
  console.error('[AI Chat] ===============================================');

  if (lastError) {
    const errorMsg = lastError.message;
    if (errorMsg.toLowerCase().includes('model') || errorMsg.toLowerCase().includes('not found')) {
      throw new Error(`MODEL_ERROR: All models failed. Last: ${errorMsg.substring(0, 150)}`);
    }
  }

  throw new Error('MODEL_ERROR: All fallback models failed');
}

/**
 * Groq 답변 생성 (@ai-sdk/groq SDK 사용)
 * 기존 방식 유지 (정상 동작 중)
 */
async function generateGroqResponse(input: ChatInput): Promise<ChatOutput> {
  const startTime = Date.now();

  // 1. API 키 검증
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY_MISSING');
  }

  // 2. 모델 초기화
  const model = groq('llama-3.3-70b-versatile');
  
  // 3. 시스템 프롬프트
  const systemPrompt = `당신은 친절하고 정확한 AI 어시스턴트입니다.

중요한 규칙:
- 핵심만 간결하게 답변하세요 (최대 300 토큰)
- 불필요한 인사말이나 긴 서론은 생략하세요
- 사용자의 질문에 직접적으로 답변하세요
- 모르는 내용은 솔직하게 "잘 모르겠습니다"라고 답하세요`.trim();

  console.log(`[AI Chat] ========================================`);
  console.log(`[AI Chat] Provider: groq`);
  console.log(`[AI Chat] Model: llama-3.3-70b-versatile`);
  console.log(`[AI Chat] SDK: @ai-sdk/groq (Vercel AI SDK)`);
  console.log(`[AI Chat] Generating response...`);
  
  try {
    const result = await generateText({
      model,
      system: systemPrompt,
      prompt: input.prompt,
      temperature: 0.7,
    });

    const latencyMs = Date.now() - startTime;

    console.log(`[AI Chat] ✅ Response generated successfully`);
    console.log(`[AI Chat] Latency: ${latencyMs}ms`);
    console.log(`[AI Chat] Tokens used (estimated): ${estimateTokens(result.text)}`);
    console.log(`[AI Chat] ========================================`);

    return {
      response: result.text,
      provider: 'groq',
      latencyMs,
      tokensUsed: estimateTokens(result.text),
    };
  } catch (error: unknown) {
    // 에러 로깅
    console.error('[AI Chat] ========== GROQ ERROR ==========');
    console.error('[AI Chat] Error type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('[AI Chat] Error message:', error instanceof Error ? error.message : String(error));
    console.error('[AI Chat] Full error:', error);
    console.error('[AI Chat] =========================================');

    if (error instanceof Error) {
      const errorMsg = error.message.toLowerCase();
      
      // Quota/Rate limit
      if (errorMsg.includes('quota') || errorMsg.includes('429') || errorMsg.includes('resource_exhausted')) {
        throw new Error('QUOTA_EXCEEDED');
      }
      
      // API Key 문제
      if (errorMsg.includes('api key') || errorMsg.includes('unauthorized') || errorMsg.includes('invalid key')) {
        throw new Error('INVALID_API_KEY');
      }
      
      // Model 문제
      if (errorMsg.includes('model') || errorMsg.includes('not found') || errorMsg.includes('unsupported')) {
        throw new Error(`MODEL_ERROR: ${error.message}`);
      }
    }

    throw error;
  }
}

/**
 * 토큰 수 추정 (대략적인 계산)
 * 
 * 영어: ~4자 = 1토큰
 * 한글: ~2자 = 1토큰
 */
function estimateTokens(text: string): number {
  const koreanChars = (text.match(/[\u3131-\uD79D]/g) || []).length;
  const otherChars = text.length - koreanChars;
  
  return Math.ceil(koreanChars / 2 + otherChars / 4);
}
