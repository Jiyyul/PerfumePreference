# Functional Flow — 비즈니스 로직 구현 계획서

작성일: 2026-01-29  
대상 레포: `C:\Users\JiyulKim\wepapp\workspace`  
역할: Senior Full-stack Solution Architect

---

## 목표

PRD 기준으로 **데이터 흐름 중심**의 핵심 비즈니스 기능을 정리하고, 각 기능의 구현 위치(Server Component / Route Handler / Client), 사용 테이블, Supabase SDK 메서드를 명시한다.

**원칙:**
- 화면 단위가 아닌 **데이터 단위**로 기능 정의
- DB 스키마는 변경하지 않음 (READ / WRITE만)
- 모든 DB 접근은 `lib/supabase/client.ts` 또는 `lib/supabase/server.ts` 사용
- Auth는 Supabase `auth.users` 기준, RLS 정책 준수

---

## 핵심 비즈니스 기능 목록 (데이터 흐름 기준)

### F1. 사용자 프로필 조회
**목적:** 인증된 사용자의 프로필 정보(`display_name`, `avatar_url`) 조회

**데이터 흐름:**
- **읽기:** `public.profiles` (WHERE `id = auth.uid()`)
- **RLS:** `profiles_select_own` 정책으로 자동 필터링

**Supabase SDK:**
```typescript
// Server Component
const supabase = await createClient(); // lib/supabase/server.ts
const { data, error } = await supabase
  .from('profiles')
  .select('id, display_name, avatar_url, created_at, updated_at')
  .eq('id', user.id)
  .single();

// Client Component
const supabase = createClient(); // lib/supabase/client.ts
const { data, error } = await supabase
  .from('profiles')
  .select('id, display_name, avatar_url')
  .single();
```

**처리 위치:**
- **Server Component:** 초기 렌더링 시 프로필 정보 필요 (예: `app/(dashboard)/layout.tsx`, `app/(dashboard)/dashboard/page.tsx`)
- **Client Component:** 실시간 프로필 업데이트 필요 시 (예: `components/common/Header.tsx`)

**의존성:** 없음 (최상위 기반 기능)

---

### F2. 향수 데이터 CRUD
**목적:** 사용자가 보유한 향수 메타데이터(`name`, `brand`, `notes_top/middle/base`, `family`, `mood`, `usage_context`) 관리

**데이터 흐름:**
- **읽기:** `public.user_perfumes` (WHERE `user_id = auth.uid()` ORDER BY `updated_at DESC`)
- **쓰기:** `public.user_perfumes` INSERT (RLS: `user_perfumes_insert_own`)
- **수정:** `public.user_perfumes` UPDATE (RLS: `user_perfumes_update_own`)
- **삭제:** `public.user_perfumes` DELETE (RLS: `user_perfumes_delete_own`)

**Supabase SDK:**
```typescript
// 읽기 (목록)
const { data, error } = await supabase
  .from('user_perfumes')
  .select('*')
  .order('updated_at', { ascending: false });

// 읽기 (단일)
const { data, error } = await supabase
  .from('user_perfumes')
  .select('*')
  .eq('id', perfumeId)
  .single();

// 쓰기
const { data, error } = await supabase
  .from('user_perfumes')
  .insert({
    user_id: userId, // auth.uid()에서 가져옴
    name: 'Bleu de Chanel',
    brand: 'Chanel',
    notes_top: ['Citrus', 'Mint'],
    notes_middle: ['Grapefruit', 'Jasmine'],
    notes_base: ['Cedar', 'Sandalwood'],
    family: 'Fresh',
    mood: 'Professional',
    usage_context: ['daily', 'work']
  })
  .select()
  .single();

// 수정
const { data, error } = await supabase
  .from('user_perfumes')
  .update({ name: 'Updated Name', ... })
  .eq('id', perfumeId)
  .select()
  .single();

// 삭제
const { error } = await supabase
  .from('user_perfumes')
  .delete()
  .eq('id', perfumeId);
```

**처리 위치:**
- **Server Component:** 초기 목록 조회 (`app/(dashboard)/dashboard/perfumes/page.tsx`)
- **Route Handler:** CREATE/UPDATE/DELETE (`app/api/perfumes/route.ts` 또는 Server Actions)
- **Client Component:** 폼 제출, 실시간 업데이트 (`components/domain/perfume/PerfumeForm.tsx`, `hooks/use-perfumes.ts`)

**의존성:** F1 (사용자 ID 필요)

---

### F3. 취향 데이터 CRUD
**목적:** 사용자 취향 정보(`preferred_notes`, `disliked_notes`, `usage_context`) 관리 (사용자당 1행)

**데이터 흐름:**
- **읽기:** `public.user_preferences` (WHERE `user_id = auth.uid()`)
- **쓰기:** `public.user_preferences` INSERT (RLS: `user_preferences_insert_own`)
- **수정:** `public.user_preferences` UPDATE (RLS: `user_preferences_update_own`, UNIQUE 제약으로 UPSERT 패턴 권장)
- **삭제:** `public.user_preferences` DELETE (RLS: `user_preferences_delete_own`, 일반적으로 사용 안 함)

**Supabase SDK:**
```typescript
// 읽기
const { data, error } = await supabase
  .from('user_preferences')
  .select('*')
  .eq('user_id', userId)
  .single(); // UNIQUE 제약으로 single() 사용

// UPSERT (INSERT or UPDATE)
const { data, error } = await supabase
  .from('user_preferences')
  .upsert({
    user_id: userId,
    preferred_notes: ['Citrus', 'Bergamot'],
    disliked_notes: ['Patchouli', 'Oud'],
    usage_context: ['daily', 'work']
  }, {
    onConflict: 'user_id' // UNIQUE 제약 컬럼
  })
  .select()
  .single();
```

**처리 위치:**
- **Server Component:** 초기 취향 조회 (`app/(dashboard)/dashboard/preferences/page.tsx`)
- **Route Handler:** UPSERT (`app/api/preferences/route.ts` 또는 Server Actions)
- **Client Component:** 폼 제출 (`components/domain/preference/PreferenceForm.tsx`, `hooks/use-preferences.ts`)

**의존성:** F1 (사용자 ID 필요)

---

### F4. 추천 결과 계산 및 저장
**목적:** 규칙 기반 엔진으로 향수별 추천/비추천 판단 후 결과 저장 (PRD: AI는 판단하지 않음)

**데이터 흐름:**
1. **입력 데이터 조회:**
   - `public.user_preferences` (취향 데이터)
   - `public.user_perfumes` (향수 목록)
2. **규칙 엔진 실행:** (클라이언트/서버 로직, `lib/recommendation-engine.ts`)
   - 입력: `userPreferences` + `perfume` 객체
   - 출력: `{ verdict: 'recommend' | 'not_recommend', score: number, reasons: string[] }`
3. **결과 저장:**
   - `public.recommendation_results` INSERT (RLS: `recommendation_results_insert_own`)
   - 저장 필드: `user_id`, `user_perfume_id`, `verdict`, `score`, `reasons`, `rule_version`, `input_snapshot` (JSONB)

**Supabase SDK:**
```typescript
// 1. 입력 데이터 조회
const [preferences, perfumes] = await Promise.all([
  supabase.from('user_preferences').select('*').eq('user_id', userId).single(),
  supabase.from('user_perfumes').select('*').eq('user_id', userId)
]);

// 2. 규칙 엔진 실행 (lib/recommendation-engine.ts)
import { calculateRecommendation } from '@/lib/recommendation-engine';

const results = perfumes.data.map(perfume => {
  const recommendation = calculateRecommendation({
    userPreferences: {
      preferredNotes: preferences.data.preferred_notes,
      dislikedNotes: preferences.data.disliked_notes,
      usageContext: preferences.data.usage_context
    },
    perfume: {
      notes: [...perfume.notes_top, ...perfume.notes_middle, ...perfume.notes_base],
      family: perfume.family,
      mood: perfume.mood
    }
  });
  
  return {
    user_id: userId,
    user_perfume_id: perfume.id,
    verdict: recommendation.verdict,
    score: recommendation.score,
    reasons: recommendation.reasons,
    rule_version: 'v1',
    input_snapshot: {
      user_preferences: preferences.data,
      perfume: perfume
    }
  };
});

// 3. 결과 저장 (배치 INSERT)
const { data, error } = await supabase
  .from('recommendation_results')
  .insert(results)
  .select();
```

**처리 위치:**
- **Route Handler:** 추천 계산 트리거 (`app/api/recommendations/generate/route.ts` POST)
  - 이유: 규칙 엔진 실행 + 배치 INSERT는 서버에서 처리 (성능, 트랜잭션)
- **Server Component:** 최신 추천 결과 조회 (`app/(dashboard)/dashboard/recommendations/page.tsx`)
- **Client Component:** "추천 생성" 버튼 클릭 (`hooks/use-recommendations.ts`)

**의존성:** F2 (향수 데이터), F3 (취향 데이터)

---

### F5. AI 설명 생성 및 저장
**목적:** 추천 결과를 입력으로 받아 자연어 설명 생성 후 저장 (PRD: AI는 판단하지 않고 설명만 수행)

**데이터 흐름:**
1. **입력 데이터 조회:**
   - `public.recommendation_results` (추천 결과)
   - `public.user_preferences` (취향 요약용)
   - `public.user_perfumes` (향수 노트 정보)
2. **AI 설명 생성:** (외부 API 호출, `lib/ai-explanation.ts`)
   - 입력: `ExplanationInput` (취향 요약 + 향수 노트 + 추천 결과)
   - 출력: `{ summary_text: string, full_text: string }`
3. **결과 저장:**
   - `public.ai_explanations` INSERT (RLS: `ai_explanations_insert_via_recommendation_owner`)
   - 저장 필드: `recommendation_result_id`, `summary_text`, `full_text`, `model`, `prompt_version`

**Supabase SDK:**
```typescript
// 1. 추천 결과 조회 (AI 설명이 없는 것만)
const { data: results, error } = await supabase
  .from('recommendation_results')
  .select(`
    *,
    user_perfumes (*),
    user_preferences (*),
    ai_explanations (id)
  `)
  .eq('user_id', userId)
  .is('ai_explanations.id', null) // 설명이 없는 것만
  .order('created_at', { ascending: false });

// 2. AI 설명 생성 (lib/ai-explanation.ts)
import { generateExplanation } from '@/lib/ai-explanation';

const explanations = await Promise.all(
  results.data.map(async (result) => {
    const explanation = await generateExplanation({
      userPreferences: {
        preferredNotes: result.user_preferences.preferred_notes,
        dislikedNotes: result.user_preferences.disliked_notes,
        usageContext: result.user_preferences.usage_context
      },
      perfume: {
        name: result.user_perfumes.name,
        notes: [
          ...result.user_perfumes.notes_top,
          ...result.user_perfumes.notes_middle,
          ...result.user_perfumes.notes_base
        ],
        family: result.user_perfumes.family,
        mood: result.user_perfumes.mood
      },
      recommendation: {
        verdict: result.verdict,
        score: result.score
      }
    });
    
    return {
      recommendation_result_id: result.id,
      summary_text: explanation.summary, // AI 응답에서 추출
      full_text: explanation.full, // AI 응답에서 추출
      model: 'gpt-4', // 또는 환경 변수
      prompt_version: 'v1'
    };
  })
);

// 3. 결과 저장
const { data, error } = await supabase
  .from('ai_explanations')
  .insert(explanations)
  .select();
```

**처리 위치:**
- **Route Handler:** AI 설명 생성 트리거 (`app/api/explanations/generate/route.ts` POST)
  - 이유: 외부 AI API 호출은 서버에서만 (API 키 보안, 비용 관리)
- **Server Component:** AI 설명 조회 (`app/(dashboard)/dashboard/recommendations/[id]/page.tsx`)
- **Client Component:** "설명 생성" 버튼 클릭 (`hooks/use-recommendations.ts`)

**의존성:** F4 (추천 결과 필요)

---

### F6. 추천 결과 + AI 설명 조회
**목적:** 사용자별 추천 결과와 AI 설명을 함께 조회하여 UI에 표시

**데이터 흐름:**
- **읽기:** `public.recommendation_results` JOIN `public.ai_explanations` (WHERE `user_id = auth.uid()`)
- **정렬:** `created_at DESC` (최신순)

**Supabase SDK:**
```typescript
// 추천 결과 + AI 설명 조회
const { data, error } = await supabase
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
    ),
    ai_explanations (
      id,
      summary_text,
      full_text,
      model,
      created_at
    )
  `)
  .eq('user_id', userId)
  .order('created_at', { ascending: false });

// 또는 향수별 최신 추천 결과만 조회
const { data, error } = await supabase
  .from('recommendation_results')
  .select(`
    *,
    ai_explanations (*)
  `)
  .eq('user_id', userId)
  .eq('user_perfume_id', perfumeId)
  .order('created_at', { ascending: false })
  .limit(1)
  .single();
```

**처리 위치:**
- **Server Component:** 초기 목록 조회 (`app/(dashboard)/dashboard/recommendations/page.tsx`)
- **Server Component:** 향수별 상세 조회 (`app/(dashboard)/dashboard/perfumes/[id]/page.tsx`)
- **Client Component:** 실시간 업데이트 필요 시 (`hooks/use-recommendations.ts`)

**의존성:** F4, F5 (추천 결과 및 AI 설명 필요)

---

## 구현 순서 (의존성 기반)

### Phase 1: Foundation (기반 데이터 관리)

**목표:** 사용자 프로필, 향수, 취향 데이터의 CRUD 기능 완성

#### 1.1 사용자 프로필 조회
- **파일:** `hooks/use-auth.ts` (프로필 조회 로직)
- **파일:** `app/(dashboard)/layout.tsx` (서버 컴포넌트에서 프로필 조회)
- **의존성:** 없음
- **우선순위:** 최상위

#### 1.2 향수 데이터 CRUD
- **파일:** `hooks/use-perfumes.ts` (CRUD 로직)
- **파일:** `app/api/perfumes/route.ts` 또는 Server Actions (CREATE/UPDATE/DELETE)
- **파일:** `app/(dashboard)/dashboard/perfumes/page.tsx` (목록 조회)
- **파일:** `app/(dashboard)/dashboard/perfumes/new/page.tsx` (생성 폼)
- **파일:** `app/(dashboard)/dashboard/perfumes/[id]/page.tsx` (상세 조회)
- **파일:** `app/(dashboard)/dashboard/perfumes/[id]/edit/page.tsx` (수정 폼)
- **의존성:** 1.1
- **우선순위:** 높음

#### 1.3 취향 데이터 CRUD
- **파일:** `hooks/use-preferences.ts` (CRUD 로직)
- **파일:** `app/api/preferences/route.ts` 또는 Server Actions (UPSERT)
- **파일:** `app/(dashboard)/dashboard/preferences/page.tsx` (조회/수정 폼)
- **의존성:** 1.1
- **우선순위:** 높음

---

### Phase 2: Core Business Logic (핵심 비즈니스 로직)

**목표:** 규칙 기반 추천 엔진 및 AI 설명 생성 기능 완성

#### 2.1 규칙 기반 추천 엔진 구현
- **파일:** `lib/recommendation-engine.ts` (규칙 로직 완성)
- **입력:** `RecommendationInput` (취향 + 향수)
- **출력:** `RecommendationOutput` (verdict, score, reasons)
- **의존성:** 1.2, 1.3
- **우선순위:** 높음

#### 2.2 추천 결과 계산 및 저장
- **파일:** `app/api/recommendations/generate/route.ts` (POST)
- **파일:** `hooks/use-recommendations.ts` (추천 생성 훅)
- **로직:** F4 데이터 흐름 구현
- **의존성:** 2.1, 1.2, 1.3
- **우선순위:** 높음

#### 2.3 AI 설명 생성 모듈 구현
- **파일:** `lib/ai-explanation.ts` (AI API 호출 완성)
- **입력:** `ExplanationInput` (취향 요약 + 향수 노트 + 추천 결과)
- **출력:** `{ summary: string, full: string }`
- **의존성:** 없음 (독립 모듈)
- **우선순위:** 중간

#### 2.4 AI 설명 생성 및 저장
- **파일:** `app/api/explanations/generate/route.ts` (POST)
- **파일:** `hooks/use-recommendations.ts` (설명 생성 훅)
- **로직:** F5 데이터 흐름 구현
- **의존성:** 2.2, 2.3
- **우선순위:** 중간

#### 2.5 추천 결과 + AI 설명 조회
- **파일:** `app/(dashboard)/dashboard/recommendations/page.tsx` (목록)
- **파일:** `app/(dashboard)/dashboard/perfumes/[id]/page.tsx` (향수별 추천 결과)
- **로직:** F6 데이터 흐름 구현
- **의존성:** 2.2, 2.4
- **우선순위:** 높음

---

### Phase 3: Interaction & Error Handling (상호작용 및 에러 처리)

**목표:** 사용자 경험 개선, 에러 처리, 로딩 상태 관리

#### 3.1 에러 처리 및 검증
- **파일:** `lib/utils.ts` (에러 처리 유틸)
- **파일:** 각 훅/API Route에 에러 핸들링 추가
- **내용:**
  - Supabase 에러 타입별 처리 (`PostgrestError`, `AuthError`)
  - RLS 정책 위반 감지 및 사용자 친화적 메시지
  - 네트워크 에러 처리
- **의존성:** Phase 1, 2
- **우선순위:** 중간

#### 3.2 로딩 상태 관리
- **파일:** 각 훅에 `isLoading` 상태 추가
- **파일:** UI 컴포넌트에 로딩 스켈레톤/스피너 추가
- **내용:**
  - 데이터 조회 중 로딩 표시
  - 폼 제출 중 버튼 비활성화
  - 배치 작업(추천 생성, AI 설명 생성) 진행률 표시
- **의존성:** Phase 1, 2
- **우선순위:** 중간

#### 3.3 사용자 피드백 (Toast, 알림)
- **파일:** `components/ui/toast.tsx` (shadcn/ui 기반)
- **파일:** 각 훅/API Route에 성공/실패 피드백 추가
- **내용:**
  - CRUD 작업 성공 시 "저장되었습니다" 메시지
  - 에러 발생 시 "오류가 발생했습니다" 메시지
  - 추천 생성 완료 시 "추천이 생성되었습니다" 메시지
- **의존성:** Phase 1, 2
- **우선순위:** 낮음

#### 3.4 데이터 갱신 최적화
- **파일:** 각 훅에 React Query 또는 SWR 도입 (선택)
- **내용:**
  - 캐시 무효화 전략
  - 낙관적 업데이트 (Optimistic Update)
  - 실시간 동기화 (Supabase Realtime, 선택)
- **의존성:** Phase 1, 2
- **우선순위:** 낮음

---

## 구현 체크리스트

### Phase 1: Foundation
- [x] Auth: Supabase Google OAuth 로그인 + `/callback`에서 code→session 교환 (Route Handler)
- [x] F1: 사용자 프로필 조회 (`hooks/use-auth.ts`에서 `profiles` 테이블 조회 + profile 필드 반환)
- [x] F2: 향수 데이터 CRUD (`hooks/use-perfumes.ts` + `app/api/perfumes/**` API Route)
- [x] F3: 취향 데이터 CRUD (`hooks/use-preferences.ts` + `app/api/preferences` API Route)

### Phase 2: Core Business Logic
- [x] F4: 규칙 기반 추천 엔진 구현 (`lib/recommendation-engine.ts`)
- [x] F4: 추천 결과 계산 및 저장 (`app/api/recommendations/generate/route.ts`)
- [ ] F5: AI 설명 생성 모듈 구현 (`lib/ai-explanation.ts`)
- [ ] F5: AI 설명 생성 및 저장 (`app/api/explanations/generate/route.ts`)
- [ ] F6: 추천 결과 + AI 설명 조회 (Server Component)

### Phase 3: Interaction & Error Handling
- [ ] 에러 처리 및 검증
- [ ] 로딩 상태 관리
- [ ] 사용자 피드백 (Toast)
- [ ] 데이터 갱신 최적화 (선택)

---

## 참고 사항

### Supabase 클라이언트 사용 가이드
- **Server Component:** `lib/supabase/server.ts`의 `createClient()` 사용
- **Route Handler:** `lib/supabase/server.ts`의 `createClient()` 사용
- **Client Component:** `lib/supabase/client.ts`의 `createClient()` 사용

### RLS 정책 준수
- 모든 쿼리는 RLS 정책에 의해 자동 필터링됨
- `auth.uid()`는 Supabase가 자동으로 주입
- 클라이언트에서 `user_id`를 명시적으로 전달할 필요 없음 (RLS가 자동 처리)

### 타입 안정성
- `types/database.ts`의 `Database` 타입을 Supabase 클라이언트에 전달
- 예: `createClient<Database>()` (타입 추론 자동)

### 트랜잭션 처리
- 배치 INSERT (추천 결과, AI 설명)는 Supabase의 단일 쿼리로 처리 가능
- 복잡한 트랜잭션이 필요한 경우 Supabase Functions 또는 PostgreSQL 함수 고려

---

## 관련 파일 맵

### 핵심 라이브러리
- `lib/supabase/client.ts` - 브라우저용 Supabase 클라이언트
- `lib/supabase/server.ts` - 서버용 Supabase 클라이언트
- `lib/recommendation-engine.ts` - 규칙 기반 추천 엔진
- `lib/ai-explanation.ts` - AI 설명 생성 모듈

### 커스텀 훅
- ✅ `hooks/use-auth.ts` - 인증 및 프로필 관리 (user + profile 조회, signIn/Out)
- ✅ `hooks/use-perfumes.ts` - 향수 데이터 관리 (list, add, update, delete)
- ✅ `hooks/use-preferences.ts` - 취향 데이터 관리 (get, update)
- ✅ `hooks/use-recommendations.ts` - 추천 결과 조회 및 생성 (fetch, generate)

### API Routes
- ✅ `app/api/perfumes/route.ts` - 향수 CRUD (GET list, POST create)
- ✅ `app/api/perfumes/[id]/route.ts` - 향수 단건 (GET/PATCH/DELETE)
- ✅ `app/api/preferences/route.ts` - 취향 UPSERT (GET current, PUT upsert)
- ✅ `app/api/_shared/auth.ts` - 권한 헬퍼 (requireUser, ensureProfileRow)
- ✅ `app/api/_shared/response.ts` - API 응답 헬퍼
- ✅ `app/api/recommendations/generate/route.ts` - 추천 생성 (배치)
- [ ] `app/api/explanations/generate/route.ts` - AI 설명 생성 (배치, F5에서 구현 예정)

### 타입 정의
- `types/database.ts` - Supabase DB 타입
- `types/api.ts` - API 공통 타입

---

**완료 단계:**
- ✅ Step 1: Auth (Google OAuth + /callback 세션 교환)
- ✅ F1: 사용자 프로필 조회 (hooks/use-auth에서 profiles 테이블 조회)
- ✅ Step 2: Perfume/Preference CRUD API Routes + hooks 연결 (F2/F3)
- ✅ F4: 규칙 기반 추천 엔진 구현 및 추천 결과 생성 API
- ✅ Build Stabilization: TypeScript/ESLint 오류 수정, 빌드 안정화 (2026-01-29)

**다음 단계:** F5 - AI 설명 생성 모듈 및 API 구현 (Phase 2)
