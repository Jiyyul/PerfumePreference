import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { RecommendationResultCard } from '@/components/recommendation/RecommendationResultCard';
import { GenerateRecommendationsButton } from '@/components/recommendation/GenerateRecommendationsButton';
import type { RecommendationWithPerfume } from '@/types/api';

/**
 * 추천 결과 페이지 (Server Component)
 * 
 * 데이터 흐름:
 * - Server Component로 초기 추천 결과 조회
 * - Client Component로 추천 생성 버튼 제공
 * - 추천 결과를 카드 형태로 표시
 */
export default async function RecommendationsPage() {
  const supabase = await createClient();

  // 인증 체크
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  // 추천 결과 조회 (recommendation_results + user_perfumes JOIN)
  const { data: rawResults, error: resultsError } = await supabase
    .from('recommendation_results')
    .select(`
      *,
      user_perfumes (*)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // 타입 변환 및 유효성 검증
  const allRecommendations: RecommendationWithPerfume[] = (rawResults || [])
    .map((item) => {
      // user_perfumes가 배열인 경우 첫 번째 요소, 객체면 그대로 사용
      const perfume = Array.isArray(item.user_perfumes)
        ? item.user_perfumes[0]
        : item.user_perfumes;

      // perfume이 없으면 이 추천 결과는 무효
      if (!perfume) {
        return null;
      }

      return {
        ...item,
        user_perfumes: perfume,
      } as RecommendationWithPerfume;
    })
    .filter((item): item is RecommendationWithPerfume => item !== null);

  // 향수별 최신 추천 결과만 필터링 (중복 제거)
  const perfumeMap = new Map<string, RecommendationWithPerfume>();
  for (const rec of allRecommendations) {
    const perfumeId = rec.user_perfume_id;
    if (!perfumeMap.has(perfumeId)) {
      perfumeMap.set(perfumeId, rec);
    }
  }
  const recommendations = Array.from(perfumeMap.values());

  // 사용자 취향 조회 (추천 생성 안내용)
  const { data: preferences } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  // 향수 목록 조회 (추천 생성 안내용)
  const { data: perfumes } = await supabase
    .from('user_perfumes')
    .select('*')
    .eq('user_id', user.id);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/dashboard">
            <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm">Dashboard로</span>
            </button>
          </Link>
          <h1 className="text-3xl font-bold">추천 결과</h1>
        </div>
        <p className="text-gray-600">
          규칙 기반 분석으로 생성된 향수 추천 결과입니다.
        </p>
      </div>

      {/* 추천 생성 안내 */}
      {(!preferences || !perfumes || perfumes.length === 0) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-2">추천 생성 준비</h2>
          <p className="text-gray-700 mb-4">
            추천 결과를 생성하려면 다음 데이터가 필요합니다:
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-700">
            {!preferences && <li>취향 데이터 (선호/비선호 노트, 사용 상황)</li>}
            {(!perfumes || perfumes.length === 0) && <li>보유 향수 목록 (최소 1개)</li>}
          </ul>
          <div className="mt-4 space-x-3">
            {!preferences && (
              <Link
                href="/dashboard/preferences"
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                취향 설정하기
              </Link>
            )}
            {(!perfumes || perfumes.length === 0) && (
              <Link
                href="/dashboard/perfumes/new"
                className="inline-block px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                향수 추가하기
              </Link>
            )}
          </div>
        </div>
      )}

      {/* 추천 생성 버튼 (Client Component) */}
      {preferences && perfumes && perfumes.length > 0 && (
        <GenerateRecommendationsButton perfumeCount={perfumes.length} />
      )}

      {/* 결과 에러 표시 */}
      {resultsError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700">
            추천 결과를 불러오는 중 오류가 발생했습니다: {resultsError.message}
          </p>
        </div>
      )}

      {/* 추천 결과 목록 */}
      {recommendations.length === 0 && !resultsError && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600 mb-4">
            아직 생성된 추천 결과가 없습니다.
          </p>
          <p className="text-sm text-gray-500">
            위의 &quot;추천 생성&quot; 버튼을 클릭하여 추천 결과를 생성해주세요.
          </p>
        </div>
      )}

      {recommendations.length > 0 && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600 mb-4">
            총 {recommendations.length}개의 추천 결과
          </p>
          {recommendations.map((recommendation) => (
            <RecommendationResultCard
              key={recommendation.id}
              recommendation={recommendation}
            />
          ))}
        </div>
      )}
    </div>
  );
}
