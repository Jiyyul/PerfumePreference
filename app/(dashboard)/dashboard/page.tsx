import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

/**
 * Dashboard 홈 페이지 (Server Component)
 * 로그인 필수 - 세션이 없으면 /login으로 리다이렉트
 */
export default async function DashboardPage() {
  const supabase = await createClient();

  // 인증 체크
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">대시보드</h1>
        <p className="text-gray-600">
          향수 취향 분석과 추천 결과를 확인하세요.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* 취향 설정 카드 */}
        <Link href="/dashboard/preferences">
          <div className="p-6 border rounded-lg hover:border-blue-500 transition-colors cursor-pointer">
            <h2 className="text-xl font-semibold mb-2">취향 설정</h2>
            <p className="text-sm text-gray-600 mb-4">
              선호하는 노트와 사용 상황을 설정합니다.
            </p>
            <Button variant="outline" size="sm">
              설정하기
            </Button>
          </div>
        </Link>

        {/* 향수 관리 카드 */}
        <Link href="/dashboard/perfumes">
          <div className="p-6 border rounded-lg hover:border-blue-500 transition-colors cursor-pointer">
            <h2 className="text-xl font-semibold mb-2">향수 관리</h2>
            <p className="text-sm text-gray-600 mb-4">
              보유 향수를 등록하고 관리합니다.
            </p>
            <Button variant="outline" size="sm">
              관리하기
            </Button>
          </div>
        </Link>

        {/* 추천 결과 카드 */}
        <Link href="/dashboard/recommendations">
          <div className="p-6 border rounded-lg hover:border-blue-500 transition-colors cursor-pointer">
            <h2 className="text-xl font-semibold mb-2">추천 결과</h2>
            <p className="text-sm text-gray-600 mb-4">
              규칙 기반 분석 결과를 확인합니다.
            </p>
            <Button variant="outline" size="sm">
              결과 보기
            </Button>
          </div>
        </Link>
      </div>
    </div>
  );
}
