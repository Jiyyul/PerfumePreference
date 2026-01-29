/**
 * 규칙 기반 추천 엔진
 * 
 * PRD: 추천 결정은 규칙 기반 로직으로 수행
 * AI는 판단하지 않고, 이미 결정된 결과를 설명만 함
 * 
 * 규칙:
 * - 선호 노트 매칭: +20점/노트
 * - 비선호 노트 감지: -30점/노트 (더 큰 가중치)
 * - 사용 상황 일치: +10점
 * - 계열(family) 매칭: +15점
 * - 분위기(mood) 매칭: +10점
 * - 기준 점수 ≥ 50: recommend
 * - 기준 점수 < 50: not_recommend
 */

import type { Database } from '@/types/database';

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
    usageContext?: string[] | null;
  };
}

export interface RecommendationOutput {
  verdict: Database['public']['Enums']['recommendation_verdict'];
  score: number;
  reasons: string[];
}

/**
 * 노트 배열에서 대소문자 무관 매칭 개수 계산
 */
function countMatches(source: string[], target: string[]): number {
  const targetLower = target.map((n) => n.toLowerCase());
  return source.filter((n) => targetLower.includes(n.toLowerCase())).length;
}

/**
 * 규칙 기반 추천 계산 함수
 */
export function calculateRecommendation(
  input: RecommendationInput
): RecommendationOutput {
  const { userPreferences, perfume } = input;
  const reasons: string[] = [];
  let score = 0;

  // 규칙 1: 선호 노트 매칭 (+20점/노트)
  const preferredMatches = countMatches(
    perfume.notes,
    userPreferences.preferredNotes
  );
  if (preferredMatches > 0) {
    const points = preferredMatches * 20;
    score += points;
    reasons.push(
      `선호하는 노트 ${preferredMatches}개 포함 (+${points}점)`
    );
  }

  // 규칙 2: 비선호 노트 감지 (-30점/노트, 가중치 높음)
  const dislikedMatches = countMatches(
    perfume.notes,
    userPreferences.dislikedNotes
  );
  if (dislikedMatches > 0) {
    const points = dislikedMatches * -30;
    score += points;
    reasons.push(
      `비선호하는 노트 ${dislikedMatches}개 포함 (${points}점)`
    );
  }

  // 규칙 3: 사용 상황 일치 (+10점)
  if (perfume.usageContext && perfume.usageContext.length > 0) {
    const contextMatches = perfume.usageContext.filter((ctx) =>
      userPreferences.usageContext.includes(ctx)
    );
    if (contextMatches.length > 0) {
      score += 10;
      reasons.push(
        `사용 상황 일치 (${contextMatches.join(', ')}) (+10점)`
      );
    }
  }

  // 규칙 4: 계열(family) 매칭 (+15점)
  // 사용자의 선호 노트에서 계열 추론 (간단한 매핑)
  const familyMap: Record<string, string[]> = {
    Floral: ['Rose', 'Jasmine', 'Lily', 'Peony', 'Tuberose', 'Iris', 'Violet'],
    Woody: ['Sandalwood', 'Cedar', 'Oud', 'Vetiver', 'Patchouli', 'Birch'],
    Fresh: ['Citrus', 'Bergamot', 'Grapefruit', 'Mint', 'Green Tea', 'Marine'],
    Spicy: ['Cardamom', 'Cinnamon', 'Pepper', 'Clove', 'Ginger', 'Saffron'],
    Sweet: ['Vanilla', 'Caramel', 'Honey', 'Tonka Bean', 'Amber', 'Benzoin'],
    Musky: ['White Musk', 'Ambroxan', 'Cashmere', 'Skin Musk', 'Clean Musk'],
  };

  const preferredFamilies = Object.entries(familyMap)
    .filter(([, notes]) =>
      userPreferences.preferredNotes.some((pref) =>
        notes.some((n) => n.toLowerCase() === pref.toLowerCase())
      )
    )
    .map(([family]) => family);

  if (
    preferredFamilies.some(
      (f) => f.toLowerCase() === perfume.family.toLowerCase()
    )
  ) {
    score += 15;
    reasons.push(`계열 일치 (${perfume.family}) (+15점)`);
  }

  // 규칙 5: 분위기(mood) 매칭 (향후 확장 예정)
  // 현재는 기본 점수만 부여 (mood 매칭 로직은 Phase 3에서 고도화)
  // 예: Professional + Woody = 잘 어울림, Romantic + Floral = 잘 어울림 등
  // 현재는 생략 (규칙 1-4만으로도 충분한 판별력 확보)

  // 최종 판정: 50점 기준
  const verdict: Database['public']['Enums']['recommendation_verdict'] =
    score >= 50 ? 'recommend' : 'not_recommend';

  // 판정 이유 추가
  if (verdict === 'recommend') {
    reasons.unshift(`종합 점수 ${score}점으로 추천`);
  } else {
    reasons.unshift(`종합 점수 ${score}점으로 비추천`);
  }

  return {
    verdict,
    score,
    reasons,
  };
}
