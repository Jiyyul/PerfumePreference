import { requireUser } from '@/app/api/_shared/auth';
import { ok, notFound, serverError, unauthorized } from '@/app/api/_shared/response';
import { calculateRecommendation } from '@/lib/recommendation-engine';
import type { Database } from '@/types/database';
import type { RecommendationGenerateResponse } from '@/types/api';

/**
 * POST /api/recommendations/generate
 * 
 * 역할: 사용자의 모든 향수에 대해 규칙 기반 추천 결과를 생성하고 저장
 * 
 * 데이터 흐름:
 * 1. user_preferences 조회 (현재 사용자 취향)
 * 2. user_perfumes 조회 (현재 사용자 향수 목록)
 * 3. 각 향수에 대해 calculateRecommendation() 호출
 * 4. 결과를 recommendation_results 테이블에 배치 INSERT
 * 
 * PRD 원칙: AI는 판단하지 않음, 규칙 엔진만 사용
 */
export async function POST() {
  // 1. 권한 체크
  const auth = await requireUser();
  if (!auth.ok) {
    return unauthorized('Unauthorized');
  }

  const { supabase, user } = auth;

  try {
    // 2. 사용자 취향 조회
    const { data: preferences, error: prefError } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (prefError) {
      return serverError(`Failed to fetch preferences: ${prefError.message}`);
    }

    if (!preferences) {
      return notFound('User preferences not found. Please set up your preferences first.');
    }

    // 3. 사용자 향수 목록 조회
    const { data: perfumes, error: perfumeError } = await supabase
      .from('user_perfumes')
      .select('*')
      .eq('user_id', user.id);

    if (perfumeError) {
      return serverError(`Failed to fetch perfumes: ${perfumeError.message}`);
    }

    if (!perfumes || perfumes.length === 0) {
      return notFound('No perfumes found. Please add perfumes first.');
    }

    // 4. 각 향수에 대해 규칙 기반 추천 계산
    const recommendationInputs: Database['public']['Tables']['recommendation_results']['Insert'][] =
      perfumes.map((perfume) => {
        // 규칙 엔진 호출
        const recommendation = calculateRecommendation({
          userPreferences: {
            preferredNotes: preferences.preferred_notes,
            dislikedNotes: preferences.disliked_notes,
            usageContext: preferences.usage_context,
          },
          perfume: {
            notes: [
              ...perfume.notes_top,
              ...perfume.notes_middle,
              ...perfume.notes_base,
            ],
            family: perfume.family,
            mood: perfume.mood,
            usageContext: perfume.usage_context,
          },
        });

        // DB INSERT용 데이터 구성
        return {
          user_id: user.id,
          user_perfume_id: perfume.id,
          verdict: recommendation.verdict,
          score: recommendation.score,
          reasons: recommendation.reasons,
          rule_version: 'v1',
          input_snapshot: {
            user_preferences: preferences,
            perfume: perfume,
          },
        };
      });

    // 5. 배치 INSERT
    // 참고: 기존 결과는 유지하고 새로운 결과만 추가 (히스토리 보존)
    // UI에서는 created_at DESC로 최신 결과만 표시
    const { data: results, error: insertError } = await supabase
      .from('recommendation_results')
      .insert(recommendationInputs)
      .select();

    if (insertError) {
      return serverError(`Failed to save recommendations: ${insertError.message}`);
    }

    // 6. 응답 반환
    const response: RecommendationGenerateResponse = {
      count: results?.length || 0,
      results: results || [],
    };

    return ok(response);
  } catch (error) {
    console.error('[POST /api/recommendations/generate]', error);
    return serverError('Internal server error');
  }
}
