/**
 * AI 설명 생성 모듈
 * 
 * PRD: AI는 추천 결과를 입력값으로 받아
 * 사용자의 취향과 향수 노트 간의 관계를 설명하는 역할만 수행
 */

export interface ExplanationInput {
  userPreferences: {
    preferredNotes: string[];
    dislikedNotes: string[];
    usageContext: string[];
  };
  perfume: {
    name: string;
    notes: string[];
    family: string;
    mood: string;
  };
  recommendation: {
    verdict: 'recommend' | 'not_recommend';
    score: number;
  };
}

export async function generateExplanation(
  input: ExplanationInput
): Promise<string> {
  // 생성형 AI API 호출 구현 예정
  // OpenAI / Vercel AI SDK 등 활용
  
  return '';
}
