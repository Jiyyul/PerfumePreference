import { requireUser } from '@/app/api/_shared/auth';
import { ok, notFound, serverError, unauthorized, badRequest } from '@/app/api/_shared/response';
import { generateExplanation, type ExplanationInput } from '@/lib/ai-explanation';
import type { Database } from '@/types/database';

/**
 * POST /api/recommendations/[id]/explain
 * 
 * 역할: 추천 결과에 대한 AI 설명 생성 및 저장
 * 
 * 비용 절감:
 * - 이미 설명이 존재하면 즉시 반환 (재생성 안 함)
 * - Gemini Flash 모델 사용 (저렴)
 * - maxTokens: 1000 제한
 * 
 * 데이터 흐름:
 * 1. recommendation_results 조회
 * 2. ai_explanations 존재 여부 확인
 * 3. 없으면 AI 생성 후 DB 저장
 * 4. 있으면 기존 설명 반환
 * 
 * PRD 원칙: AI는 판단하지 않고, 규칙 엔진의 결과를 설명만 함
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // 1. 권한 체크
  const auth = await requireUser();
  if (!auth.ok) {
    return unauthorized('Unauthorized');
  }

  const { supabase, user } = auth;
  const { id: recommendationId } = await params;

  try {
    // 2. recommendation_result 조회 (향수 정보 포함)
    const { data: recommendation, error: recError } = await supabase
      .from('recommendation_results')
      .select(`
        *,
        user_perfumes (
          id,
          name,
          brand,
          notes_top,
          notes_middle,
          notes_base,
          family,
          mood
        )
      `)
      .eq('id', recommendationId)
      .eq('user_id', user.id) // RLS로 이중 체크
      .single();

    if (recError || !recommendation) {
      console.error('[POST /api/recommendations/[id]/explain] Recommendation not found:', recError);
      return notFound('Recommendation not found');
    }

    // 3. 이미 AI 설명이 있는지 확인
    const { data: existingExplanation, error: explError } = await supabase
      .from('ai_explanations')
      .select('*')
      .eq('recommendation_result_id', recommendationId)
      .maybeSingle();

    if (explError) {
      console.error('[POST /api/recommendations/[id]/explain] Error checking existing explanation:', explError);
      // 조회 실패는 무시하고 계속 진행
    }

    // 이미 설명이 있으면 즉시 반환 (비용 절감)
    if (existingExplanation) {
      console.log('[POST /api/recommendations/[id]/explain] Returning cached explanation');
      return ok(existingExplanation);
    }

    // 4. input_snapshot에서 user_preferences 추출
    const inputSnapshot = recommendation.input_snapshot as {
      user_preferences?: {
        preferred_notes?: string[];
        disliked_notes?: string[];
        usage_context?: string[];
      };
    };

    const userPreferences = inputSnapshot?.user_preferences;
    if (!userPreferences) {
      return badRequest('Invalid recommendation data: missing user_preferences in input_snapshot');
    }

    // 5. AI 설명 생성 입력 데이터 구성
    const perfumeData = recommendation.user_perfumes as unknown as Database['public']['Tables']['user_perfumes']['Row'];
    
    if (!perfumeData) {
      return badRequest('Invalid recommendation data: missing perfume data');
    }

    const explanationInput: ExplanationInput = {
      userPreferences: {
        preferredNotes: userPreferences.preferred_notes || [],
        dislikedNotes: userPreferences.disliked_notes || [],
        usageContext: userPreferences.usage_context || [],
      },
      perfume: {
        name: perfumeData.name,
        brand: perfumeData.brand,
        notes: [
          ...perfumeData.notes_top,
          ...perfumeData.notes_middle,
          ...perfumeData.notes_base,
        ],
        family: perfumeData.family,
        mood: perfumeData.mood,
      },
      recommendation: {
        verdict: recommendation.verdict,
        score: recommendation.score,
        reasons: recommendation.reasons,
      },
    };

    // 6. AI 설명 생성
    console.log(`[POST /api/recommendations/[id]/explain] Generating explanation for recommendation ${recommendationId}`);
    
    let explanation;
    try {
      explanation = await generateExplanation(explanationInput);
    } catch (error: unknown) {
      console.error('[POST /api/recommendations/[id]/explain] AI generation error:', error);
      
      // 특정 에러 타입별 처리
      if (error instanceof Error) {
        if (error.message === 'QUOTA_EXCEEDED') {
          return serverError('AI 서비스 할당량이 초과되었습니다. 잠시 후 다시 시도해 주세요.');
        }
        if (error.message === 'INVALID_API_KEY') {
          return serverError('AI 서비스 설정 오류가 발생했습니다.');
        }
      }
      
      return serverError('AI 설명 생성에 실패했습니다. 다시 시도해 주세요.');
    }

    // 7. DB에 저장
    const { data: savedExplanation, error: saveError } = await supabase
      .from('ai_explanations')
      .insert({
        recommendation_result_id: recommendationId,
        summary_text: explanation.summary,
        full_text: explanation.fullText,
        model: explanation.model,
        prompt_version: explanation.promptVersion,
      })
      .select()
      .single();

    if (saveError) {
      console.error('[POST /api/recommendations/[id]/explain] Failed to save explanation:', saveError);
      return serverError('설명 저장에 실패했습니다.');
    }

    console.log(`[POST /api/recommendations/[id]/explain] Explanation saved successfully`);
    console.log(`[POST /api/recommendations/[id]/explain] Tokens used (estimated): ${explanation.tokensUsed}`);

    return ok(savedExplanation);
  } catch (error) {
    console.error('[POST /api/recommendations/[id]/explain] Unexpected error:', error);
    return serverError('Internal server error');
  }
}
