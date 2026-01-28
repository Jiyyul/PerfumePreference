/**
 * 규칙 기반 추천 엔진
 * 
 * PRD: 추천 결정은 규칙 기반 로직으로 수행
 * AI는 판단하지 않고, 이미 결정된 결과를 설명만 함
 */

export interface RecommendationInput {
  userPreferences: {
    preferredNotes: string[];
    dislikedNotes: string[];
    usageContext: string[];
  };
  perfume: {
    notes: string[];
    family: string;
    mood: string;
  };
}

export interface RecommendationOutput {
  verdict: 'recommend' | 'not_recommend';
  score: number;
  reasons: string[];
}

export function calculateRecommendation(
  input: RecommendationInput
): RecommendationOutput {
  // 규칙 기반 추천 로직 구현 예정
  // 점수 기반으로 recommend/not_recommend 결정
  
  return {
    verdict: 'recommend',
    score: 0,
    reasons: [],
  };
}
