## 004 - Supabase Auth: Google OAuth + /callback 세션 교환 확정

### 1) 날짜 및 작업자
- **작업 날짜**: 2026-01-29
- **작업자**: 시니어 개발자 & AI 파트너(Cursor)

### 2) 변경 내용 (What)
- **Supabase OAuth 로그인 플로우 연결**
  - `hooks/use-auth.ts`에 Supabase 세션 기반 로그인/로그아웃 흐름을 구현하고,
    Supabase 환경변수 유무에 따라 **Mock ↔ Supabase 모드를 자동 전환**하도록 구성.
  - `app/(auth)/login/page.tsx`에서 로그인 버튼이 `useAuth()`를 통해
    - Supabase 모드: Google OAuth로 redirect
    - Mock 모드: 즉시 로그인 처리 후 `/dashboard` 이동
    으로 동작하도록 연결.
  - `components/common/Header.tsx`에서 인증 상태 표시/로그아웃이 `useAuth()` 기반으로 동작하도록 연결.

- **OAuth callback에서 code → session 교환(Route Handler) 구현**
  - `app/(auth)/callback/route.ts` (GET)에서 `code` 쿼리를 받아
    `exchangeCodeForSession(code)` 실행 후 `/dashboard`로 redirect.
  - `/callback`은 UI page가 아니라 **세션 교환을 수행하는 서버 라우트**로 확정.

### 3) 구조 확정 이유 (Why)
- **Phase 1~2의 서버 작업(쓰기/배치/권한 검증)이 “세션 기반” 전제**이기 때문.
  - 이후 구현될 CRUD 및 추천/설명 생성은 Route Handler에서 `auth.getUser()`/RLS 전제로 동작해야 하며,
    Mock 로그인만으로는 운영 환경과 동일한 권한/세션 흐름을 검증할 수 없음.
- **OAuth callback은 서버에서 처리해야 함**
  - code → session 교환은 쿠키 세션 설정과 연결되며, 클라이언트 페이지로 처리할 경우 안정성과 운영 일관성이 떨어짐.
  - 따라서 `/callback`을 route handler로 두고, 세션 확립 후 앱 내부 라우팅(`/dashboard`)으로 진입시키는 구조로 확정.

### 4) OAuth callback(route) 동작 설명 (How)
- **진입**: `/callback?code=...&next=/dashboard` (next는 선택)
- **처리**:
  1) `code` 존재 여부 확인 (없으면 `/login`으로 redirect)
  2) `exchangeCodeForSession(code)`로 세션 교환 및 쿠키 세팅
  3) 성공 시 `next` 또는 기본값 `/dashboard`로 redirect
  4) 실패/에러 시 `/login`으로 redirect

### 5) Mock ↔ Supabase 자동 전환 정책
- **Supabase 환경변수(`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)가 설정되면**
  - Supabase OAuth/세션 기반으로 동작 (운영 플로우에 준함)
- **환경변수가 없으면**
  - 기존 Mock 로그인 흐름으로 동작 (UI/플로우 검증용 “Dev Mode”)

### 6) 발생 이슈 및 해결
- **이슈: `/callback` 경로 충돌**
  - 동일 경로에 `page.tsx`와 `route.ts`가 함께 존재하여 Next.js 빌드에서 route 충돌 발생.
- **해결**
  - `/callback`은 “세션 교환 전용 route”로 확정하고, `app/(auth)/callback/page.tsx`를 제거.
  - 빌드/타입체크 기준으로 `/callback`은 `route.ts` 단일 엔트리로 유지.

### 7) 검증 결과 (Verification)
- `pnpm lint`: 에러 0
- `pnpm build`: 성공
- `pnpm dev`: 로컬 개발 서버 기동 확인

