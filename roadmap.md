# Roadmap — Supabase SDK 기반 Google OAuth 구현 계획 (Step-by-step)

작성일: 2026-01-29  
대상 레포: `C:\Users\JiyulKim\wepapp\workspace`

## 목표

- **Supabase Auth + Google OAuth**로 로그인/로그아웃을 구현한다.
- 인증 이후 사용자별 데이터 접근은 **RLS + `auth.uid()` 기반**으로 유지한다.
- PRD/FLOW 원칙 준수: **추천 판단은 규칙 엔진**, AI는 **설명 생성/저장** 역할만 수행.

## 현 상태 요약 (문서/소스 분석 결과)

- **프론트**: Next.js App Router 구조 (`app/(auth)`, `app/(dashboard)`).
- **Supabase SDK 인프라**: `lib/supabase/client.ts`, `lib/supabase/server.ts`, `middleware.ts`에 `@supabase/ssr` 기반 클라이언트가 준비되어 있음.
- **인증 상태** ✅ **완료 (Step 1)**:
  - `hooks/use-auth.ts`: Supabase OAuth/세션 기반 + Mock 자동 전환 구현
  - `app/(auth)/login/page.tsx`는 “Google로 로그인” UI를 제공하지만 실제 OAuth 호출 없이 mock user 생성.
  - `app/(auth)/callback/route.ts`: OAuth code→session 교환 (Route Handler)
  - `components/common/Header.tsx`: 인증 상태 표시/로그아웃
- **라우트 보호**: `middleware.ts`가 `/dashboard/*`에 대해 `supabase.auth.getUser()`로 미인증 시 `/login`으로 리다이렉트.
- **데이터 쓰기 경로** ✅ **완료 (Step 2)**:
  - `app/api/perfumes/route.ts` + `[id]/route.ts`: Perfume CRUD API
  - `app/api/preferences/route.ts`: Preference UPSERT API
  - `hooks/use-perfumes.ts`, `hooks/use-preferences.ts`: API 호출 래퍼
  - 권한 경계: `requireUser()` + RLS 이중 보호
  - profiles 부트스트랩: `ensureProfileRow()` (FK 제약 대비)
- **추천 엔진** ✅ **완료 (Step 3, 2026-01-29)**:
  - `lib/recommendation-engine.ts`: 규칙 기반 추천 로직 (verdict, score, reasons)
  - `app/api/recommendations/generate/route.ts`: 추천 생성 API (배치 처리)
  - `hooks/use-recommendations.ts`: 추천 결과 조회 및 생성 훅
  - `app/(dashboard)/dashboard/recommendations/page.tsx`: 추천 결과 페이지
- **빌드 안정화** ✅ **완료 (2026-01-29)**:
  - TypeScript/ESLint 오류 수정
  - Unused imports/variables 정리
  - 환경 변수 포맷 개선
  - 프로덕션 빌드 검증 완료 (17 routes)
- **DB 스키마**: `supabase/migrations/20260129_000001_schema_v1.sql`에 `profiles`, `user_preferences`, `user_perfumes`, `recommendation_results`, `ai_explanations` + RLS 정책 존재.

## 구현 로드맵 (권장 실행 순서)

### Phase 0 — 외부 설정(필수): Google OAuth & Supabase Dashboard

1. **Google Cloud Console에서 OAuth Client 생성**
   - OAuth 동의 화면(External/Internal) 설정
   - OAuth 2.0 Client ID 생성 (Web application)
   - Authorized redirect URI는 **Supabase가 제공하는 Callback URL**(Supabase 대시보드에 표시되는 값)을 우선 등록
     - 일반적으로: `https://<project-ref>.supabase.co/auth/v1/callback`

2. **Supabase Dashboard에서 Google Provider 활성화**
   - `Authentication > Providers > Google` 활성화
   - Google Client ID / Secret 등록

3. **Redirect URL / Site URL 정리**
   - 현재 앱 라우트 기준(소스 기준):
     - Login: `/login` (`app/(auth)/login/page.tsx`)
     - Callback: `/callback` (`app/(auth)/callback/*`)
   - Supabase에 앱 리다이렉트 허용 목록을 설정:
     - Dev: `http://localhost:3000/callback`
     - Prod: `https://<YOUR_DOMAIN>/callback`
   - (권장) `Authentication > URL Configuration`에서 Site URL / Redirect URLs를 위 값으로 명확히 관리

4. **로컬 환경 변수 확인**
   - `.env.local`에 최소 다음이 존재해야 함:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - 참고: `middleware.ts`는 위 env가 없으면 인증 체크를 스킵하도록 되어 있음(개발 초기 편의).

---

### Phase 1 — 앱 인증 플로우 구현(핵심): Supabase SDK + Google OAuth

> 목표: “Login 버튼 클릭 → Google OAuth → `/callback`에서 세션 확정 → `/dashboard` 진입”이 **mock 없이** 동작.

1. **Auth Hook/Provider 설계 확정 (mock 제거 전 준비)**
   - 파일: `hooks/use-auth.ts`
   - 최소 제공 인터페이스:
     - `user` (Supabase user 또는 프로필)
     - `isLoading`
     - `signInWithGoogle()`
     - `signOut()`
   - 클라이언트에서 `lib/supabase/client.ts`의 `createClient()`를 사용하도록 통일

2. **Login 페이지에서 실제 OAuth 시작**
   - 파일: `app/(auth)/login/page.tsx`
   - mock 로직(`useMockAuth`, `loginWithMockGoogle`) 제거
   - `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } })` 호출
     - `redirectTo`는 환경별로 안전하게 계산:
       - Dev 예: `http://localhost:3000/callback`
       - Prod 예: `https://<YOUR_DOMAIN>/callback`
     - Next.js에서는 `window.location.origin` 기반으로 계산하는 방식이 단순(클라이언트 컴포넌트이므로 가능)

3. **Callback 처리 구현 (세션 확정)**
   - 파일(현재): `app/(auth)/callback/page.tsx` (placeholder)
   - 권장 구현 방향은 둘 중 하나를 선택:
     - **A안(권장)**: `/callback`을 **Route Handler**로 전환하여 서버에서 `exchangeCodeForSession` 처리
       - 장점: 쿠키 기반 SSR 세션과 일관 (`@supabase/ssr` 의도에 부합), 미들웨어/서버 컴포넌트와 자연스럽게 연결
       - 구현 위치 예:
         - `app/(auth)/callback/route.ts`로 GET 처리 + `NextResponse.redirect('/dashboard')`
       - 유의: `route.ts`를 만들면 동일 경로의 `page.tsx`는 GET에서 사용되지 않으므로, 로딩 UI가 필요하면 경로를 분리해야 함
     - **B안**: `/callback`을 **클라이언트 페이지**로 유지하고 브라우저에서 세션 교환/설정
       - 장점: UI/로딩 표시는 쉬움
       - 유의: 쿠키/SSR 세션 정합성을 반드시 확인해야 함(미들웨어가 `getUser()`를 정상 인식하는지)

4. **전역 MockAuthProvider 제거 및 Header 연동**
   - 파일: `app/layout.tsx`, `components/common/Header.tsx`
   - `MockAuthProvider` 제거
   - `Header`는 `useAuth()` 기반으로 로그인 상태/로그아웃 버튼을 렌더
   - 로그인 상태 문구(현재 “Dev Mode · Mock Login”)는 실제 인증 상태를 반영하도록 조정

5. **도메인 auth 컴포넌트 정리**
   - 파일: `components/domain/auth/LoginButton.tsx`, `components/domain/auth/UserMenu.tsx`
   - `LoginButton`은 `useAuth().signInWithGoogle()`을 호출하는 thin wrapper로 만들고,
     페이지(`/(auth)/login`) 또는 헤더에서 재사용
   - `UserMenu`는 (최소) email 표시 + logout 제공

6. **라우팅/가드 정합성 점검**
   - 파일: `middleware.ts`
   - 현재 로직:
     - `/dashboard/*` → 미인증이면 `/login`
     - `/login` 또는 `/callback` → 인증이면 `/dashboard`
   - 실제 구현 후, “콜백 직후” 타이밍에서 `user`가 즉시 인식되는지 확인(세션 교환 방식에 따라 중요)

---

### Phase 2 — DB 프로필 부트스트랩(필수): `profiles` 자동 생성 트리거

> 목표: Google OAuth로 처음 로그인한 사용자가 **DB의 `public.profiles`를 항상 보유**하도록 보장.

1. **Impact Analysis**
   - 영향 테이블: `public.profiles` (생성), `auth.users` (INSERT 트리거)
   - 영향 코드: `hooks/use-auth.ts`에서 프로필 조회 시 “없음” 케이스 감소
   - RLS: `profiles_insert_own` 정책과 충돌 가능성(트리거는 `SECURITY DEFINER`로 우회 가능)

2. **사전 검증 쿼리(Pre-Migration Check)**
   - 기존 사용자 중 `profiles`가 없는 사용자 확인:
     - `select count(*) from auth.users u left join public.profiles p on p.id = u.id where p.id is null;`

3. **마이그레이션 추가**
   - 파일 생성(예시 이름; 실제는 타임스탬프 규칙 준수):
     - `supabase/migrations/YYYYMMDD_HHMMSS_auth_profile_bootstrap_v1.sql`
   - 포함 내용(개념):
     - `public.handle_new_user()` 함수 생성/교체
     - `auth.users` AFTER INSERT 트리거 생성
     - (선택) 이미 존재하는 사용자에 대한 `profiles` 백필(backfill) 구문은 “운영 데이터” 관점에서 별도 단계로 분리 권장

4. **검증 쿼리(Verification)**
   - 신규 유저 로그인 후:
     - `select * from public.profiles where id = auth.uid();`

5. **Rollback SQL**
   - 트리거 DROP, 함수 DROP(또는 이전 버전 복원)

6. **타입 업데이트**
   - `types/database.ts`를 Supabase CLI로 재생성하거나(README에 명시),
     최소한 마이그레이션 변경분과 불일치가 없도록 점검

---

### Phase 3 — 문서/타입 정합성 정리(권장): 스키마 문서 업데이트

> 목표: 구현과 문서가 엇갈려서 생기는 시행착오를 줄임.

1. `docs/db-schema.md`를 `supabase/migrations/20260129_000001_schema_v1.sql` 기준으로 정리
   - 특히 `ai_explanations`(summary/full 구조), `user_perfumes`(top/middle/base) 등
2. `docs/history/`에 “인증(구현) 단계” 변경 기록이 필요하면 신규 파일로 남김
   - (의존성 추가가 없더라도, mock → real auth 전환은 운영 관점에서 중요 변경이므로 기록 권장)

---

### Phase 4 — 검증(테스트 플로우): 로컬/운영 체크리스트

1. **로컬 기능 테스트**
   - `/login`에서 Google 로그인 클릭 → Google consent → `/callback` → `/dashboard` 진입
   - 새로고침/브라우저 재시작 후에도 `/dashboard` 접근 유지(세션 유지 확인)
   - `/dashboard` 미인증 접근 시 `/login` 리다이렉트 확인

2. **DB/RLS 검증**
   - 로그인한 계정으로 자신의 `user_perfumes`, `user_preferences`, `recommendation_results`, `ai_explanations`만 조회 가능한지 확인
   - 다른 사용자 데이터 접근이 차단되는지 확인(운영 안전성)

3. **프로필 자동 생성 검증**
   - 첫 로그인 직후 `public.profiles` 행이 생성되는지 확인
   - `display_name`, `avatar_url` 매핑이 기대대로인지 확인(트리거 로직에 따라)

4. **배포 전 체크**
   - Supabase Redirect URLs에 프로덕션 도메인 `/callback` 등록
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`가 배포 환경에 주입됨
   - (선택) `middleware.ts`의 “env 없으면 통과” 로직이 운영에서 원하는 정책인지 재검토

## 관련 파일 맵(빠른 참조)

### 인증 (Step 1 완료)
- Supabase client: `lib/supabase/client.ts`
- Supabase server: `lib/supabase/server.ts`
- Auth middleware guard: `middleware.ts`
- Auth hook: `hooks/use-auth.ts`
- Login page: `app/(auth)/login/page.tsx`
- Callback route: `app/(auth)/callback/route.ts`
- Mock auth (dev fallback): `lib/mock-auth.tsx`
- Root provider: `app/layout.tsx`
- Header: `components/common/Header.tsx`

### 데이터 CRUD (Step 2 완료)
- API 공유 헬퍼: `app/api/_shared/auth.ts`, `app/api/_shared/response.ts`
- Perfume API: `app/api/perfumes/route.ts`, `app/api/perfumes/[id]/route.ts`
- Preference API: `app/api/preferences/route.ts`
- Perfume hook: `hooks/use-perfumes.ts`
- Preference hook: `hooks/use-preferences.ts`
- Perfume page: `app/(dashboard)/dashboard/perfumes/page.tsx`
- Preference page: `app/(dashboard)/dashboard/preferences/page.tsx`

### 스키마/타입
- DB migration(v1): `supabase/migrations/20260129_000001_schema_v1.sql`
- DB types: `types/database.ts`
- API types: `types/api.ts`

