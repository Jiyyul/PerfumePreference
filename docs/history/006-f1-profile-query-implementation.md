## 006 - F1: 사용자 프로필 조회 구현 완료

### 1) 날짜 및 작업자
- **작업 날짜**: 2026-01-29
- **작업자**: 시니어 개발자 & AI 파트너(Cursor)

### 2) 변경 내용 (What)
- **hooks/use-auth.ts 확장**
  - `Profile` 타입 정의 추가 (`Database['public']['Tables']['profiles']['Row']`)
  - `profile` state 추가 (`useState<Profile | null>`)
  - `fetchProfile` 함수 구현 (profiles 테이블 조회)
  - user 인증 시 자동으로 profile 조회
  - `onAuthStateChange` 시마다 profile 재조회
  - Mock 모드에서 가상 profile 객체 생성

- **components/common/Header.tsx 업데이트**
  - `useAuth`에서 `profile` 필드 구조 분해
  - `profile.display_name` 우선 표시 (fallback: `user.email`)

- **검증 페이지 생성**
  - `app/(dashboard)/dashboard/profile-test/page.tsx`
  - F1 검증을 위한 전용 테스트 페이지
  - user, profile 정보를 JSON으로 표시
  - Auth mode, Profile 존재 여부 등 검증

### 3) 구현 이유 (Why)
- **F1 요구사항 완료**: functional_flow.md의 Phase 1 체크리스트 항목
- **프로필 정보 활용 준비**: 
  - Header에서 사용자 이름 표시
  - 향후 프로필 편집 기능 기반 마련
  - display_name, avatar_url 등 추가 정보 활용 가능
- **Auth 흐름 완성**: 
  - Step 1: auth.users (인증)
  - F1: profiles (프로필 정보)
  - 이제 user + profile 모두 useAuth에서 제공

### 4) 구현 세부사항 (Specification)

#### fetchProfile 로직
```typescript
const fetchProfile = async (userId: string | null) => {
  if (!userId) {
    if (mounted) setProfile(null);
    return;
  }
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (mounted) setProfile(data ?? null);
};
```

- `maybeSingle()`: profile이 없어도 에러 없이 null 반환
- RLS 정책에 의해 자동으로 본인 profile만 조회 가능
- user 상태 변경 시 자동으로 재조회

#### Mock 모드 profile 생성
```typescript
profile: mock.user
  ? {
      id: mock.user.id,
      display_name: mock.user.email?.split('@')[0] ?? 'Mock User',
      avatar_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  : null
```

- Mock 로그인 시에도 profile 객체 제공
- display_name은 email의 @앞부분 사용
- 실제 DB 접근 없이 UI 테스트 가능

### 5) 검증 결과 (Verification)

#### 자동 검증 (test-f1-profile.mjs) ✅
| 항목 | 결과 |
|------|------|
| Profile 타입 정의 | ✅ |
| profile state 선언 | ✅ |
| fetchProfile 함수 | ✅ |
| profiles 테이블 조회 | ✅ |
| profile 필드 반환 (mock) | ✅ |
| profile 필드 반환 (supabase) | ✅ |
| Header에서 profile 구조 분해 | ✅ |
| profile.display_name 사용 | ✅ |
| F1 체크리스트 완료 표시 | ✅ |
| 테스트 페이지 생성 | ✅ |
| profile 필드 테스트 | ✅ |

**전체 11개 항목 통과** ✅

#### 정적 검증 ✅
- `pnpm lint`: 에러 0 (경고 7개는 temp-v0/placeholder)
- `pnpm build`: 성공
- 타입 체크 통과
- `/dashboard/profile-test` 라우트 정상 등록

#### 매뉴얼 테스트 가이드
1. 브라우저에서 `http://localhost:3000/login` 접속
2. Mock 로그인 또는 Google OAuth 로그인
3. `http://localhost:3000/dashboard/profile-test` 접속
4. profile 필드에 데이터가 표시되는지 확인
5. Header에서 display_name이 표시되는지 확인

### 6) RLS 및 보안
- profiles 테이블의 RLS 정책에 의해 자동으로 본인 데이터만 조회 가능
- `auth.uid() = id` 조건으로 다른 사용자 profile 접근 차단
- ensureProfileRow()가 API Routes에서 profile 생성을 보장하므로, 
  로그인 후 profile이 없는 경우는 API 사용 전까지만 발생 가능

### 7) Phase 1 완료 현황

| 항목 | 상태 | 파일 |
|------|------|------|
| Auth (Google OAuth) | ✅ | `hooks/use-auth.ts`, `app/(auth)/callback/route.ts` |
| F1 (프로필 조회) | ✅ | `hooks/use-auth.ts` (profiles 조회 추가) |
| F2 (향수 CRUD) | ✅ | `app/api/perfumes/**`, `hooks/use-perfumes.ts` |
| F3 (취향 CRUD) | ✅ | `app/api/preferences/**`, `hooks/use-preferences.ts` |

**Phase 1 완전 완료** 🎉

### 8) 다음 단계 (Phase 2)
- 추천 엔진 완성 (`lib/recommendation-engine.ts`)
- 추천 생성 API (`/api/recommendations/generate`)
- AI 설명 생성 API (`/api/explanations/generate`)
- UI/UX 개선 (로딩 상태, 에러 처리, Toast 피드백)
