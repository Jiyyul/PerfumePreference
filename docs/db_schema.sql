-- ============================================================================
-- Scentory Database Schema (Initial Creation)
-- ============================================================================
-- 
-- 목적: 향수 취향 분석 및 AI 추천 설명 서비스의 초기 데이터베이스 스키마
-- 
-- ⚠️ 중요 경고 사항:
-- 1. 이 스키마는 초기 생성 전용입니다. 이미 테이블이 존재하는 경우
--    supabase/migrations/ 디렉토리의 마이그레이션 파일을 사용하세요.
-- 
-- 2. 구조적 수정 비용이 큰 설계 결정:
--    - user_perfumes.notes는 top/middle/base로 분리 저장 (UI 렌더링 최적화)
--      → 향후 단일 배열로 통합하려면 데이터 마이그레이션 필요
--    - ai_explanations.summary_text와 full_text 분리 저장
--      → 향후 단일 필드로 통합하려면 애플리케이션 로직 수정 필요
--    - recommendation_results.verdict는 ENUM 타입 사용
--      → 새로운 판단 타입 추가 시 ALTER TYPE 필요 (주의 필요)
-- 
-- 3. 향후 확장 고려사항 (현재 미포함, ALTER로 추가 가능):
--    - 즐겨찾기/북마크 기능: user_perfumes에 is_favorite boolean 추가
--    - 태그 시스템: 별도 tags 테이블 + N:M 관계 테이블 추가
--    - 향수 이미지: user_perfumes에 image_url text 추가
--    - 소셜 기능: 공유, 댓글 등 (별도 테이블 필요)
-- 
-- 실행 방법:
-- 1. Supabase Dashboard → SQL Editor 열기
-- 2. 이 파일 전체를 복사하여 붙여넣기
-- 3. 실행 (Run) 버튼 클릭
-- 
-- ============================================================================

-- Extensions
-- UUID 생성 및 암호화 함수를 위한 확장
create extension if not exists "pgcrypto";

-- ============================================================================
-- ENUMS
-- ============================================================================

-- 추천 판단 결과 타입
-- 'recommend': 추천, 'not_recommend': 비추천
create type public.recommendation_verdict as enum ('recommend', 'not_recommend');

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- updated_at 컬럼을 자동으로 갱신하는 공통 함수
-- 각 테이블의 UPDATE 트리거에서 사용
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================================
-- TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- profiles
-- ----------------------------------------------------------------------------
-- 역할: Supabase Auth(auth.users)와 1:1로 연결되는 사용자 프로필 확장 테이블
-- 목적: 
--   - auth.users에는 기본 인증 정보만 저장되므로, 앱 레벨의 추가 정보 저장
--   - 표시명(display_name), 아바타(avatar_url) 등 UI에 필요한 사용자 메타데이터 관리
-- 관계: auth.users(id) ←→ profiles(id) [1:1, CASCADE]
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- updated_at 자동 갱신 트리거
create trigger trg_profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- user_preferences
-- ----------------------------------------------------------------------------
-- 역할: 사용자 취향 데이터 저장 (사용자당 1행)
-- 목적:
--   - 선호 노트(preferred_notes), 비선호 노트(disliked_notes), 사용 상황(usage_context) 저장
--   - 규칙 기반 추천 엔진의 입력값으로 사용
--   - UI의 취향 입력 폼(/dashboard/preferences)과 연동
-- 관계: profiles(id) ←→ user_preferences(user_id) [1:1, UNIQUE, CASCADE]
create table public.user_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  preferred_notes text[] not null default '{}'::text[],
  disliked_notes text[] not null default '{}'::text[],
  usage_context text[] not null default '{}'::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- updated_at 자동 갱신 트리거
create trigger trg_user_preferences_set_updated_at
before update on public.user_preferences
for each row
execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- user_perfumes
-- ----------------------------------------------------------------------------
-- 역할: 사용자가 보유한 향수 메타데이터 저장
-- 목적:
--   - 향수 이름, 브랜드, 노트 구조(top/middle/base), 계열(family), 분위기(mood) 저장
--   - UI의 향수 카드/상세 화면에서 렌더링되는 모든 필드 포함
--   - 규칙 기반 추천 엔진의 입력값(perfume 객체)으로 사용
-- 관계: profiles(id) ←→ user_perfumes(user_id) [1:N, CASCADE]
-- 
-- ⚠️ 설계 결정: notes를 top/middle/base로 분리 저장
--   - 이유: UI가 구조화된 노트를 요구 (PerfumeCard, PerfumeDetail 컴포넌트)
--   - 장점: UI 렌더링 시 변환 로직 불필요, 쿼리 성능 최적화 가능
--   - 단점: 향후 단일 배열로 통합하려면 데이터 마이그레이션 필요
create table public.user_perfumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  brand text not null,
  notes_top text[] not null default '{}'::text[],
  notes_middle text[] not null default '{}'::text[],
  notes_base text[] not null default '{}'::text[],
  family text not null,
  mood text not null,
  usage_context text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- updated_at 자동 갱신 트리거
create trigger trg_user_perfumes_set_updated_at
before update on public.user_perfumes
for each row
execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- recommendation_results
-- ----------------------------------------------------------------------------
-- 역할: 규칙 기반 추천 엔진의 실행 결과 저장 (히스토리)
-- 목적:
--   - 향수별 추천/비추천 판단 결과(verdict), 점수(score), 판단 이유(reasons) 저장
--   - 재현성을 위한 메타데이터(rule_version, input_snapshot) 포함
--   - 동일 향수에 대해 여러 번 실행 가능 (created_at으로 최신 결과 식별)
-- 관계: 
--   - profiles(id) ←→ recommendation_results(user_id) [1:N, CASCADE]
--   - user_perfumes(id) ←→ recommendation_results(user_perfume_id) [1:N, CASCADE]
-- 
-- ⚠️ 설계 결정: verdict는 ENUM 타입 사용
--   - 이유: 타입 안정성 및 데이터 무결성 보장
--   - 단점: 새로운 판단 타입 추가 시 ALTER TYPE 필요 (주의 필요)
create table public.recommendation_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  user_perfume_id uuid not null references public.user_perfumes(id) on delete cascade,
  verdict public.recommendation_verdict not null,
  score numeric(6, 2) not null,
  reasons text[] not null default '{}'::text[],
  rule_version text not null default 'v1',
  input_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- ai_explanations
-- ----------------------------------------------------------------------------
-- 역할: 추천 결과에 대한 AI 생성 설명 저장 (서비스 자산)
-- 목적:
--   - 규칙 엔진의 판단 결과를 자연어로 설명한 텍스트 저장
--   - UI의 요약 설명(summary_text)과 상세 설명(full_text) 분리 저장
--   - AI 모델 정보, 프롬프트 버전 등 메타데이터 포함
-- 관계: recommendation_results(id) ←→ ai_explanations(recommendation_result_id) [1:1, UNIQUE, CASCADE]
-- 
-- ⚠️ 설계 결정: summary_text와 full_text 분리 저장
--   - 이유: UI가 카드용 요약(aiExplanation)과 상세용 긴 설명(fullExplanation)을 구분
--   - 장점: UI 렌더링 시 조건부 로직 최소화
--   - 단점: 향후 단일 필드로 통합하려면 애플리케이션 로직 수정 필요
create table public.ai_explanations (
  id uuid primary key default gen_random_uuid(),
  recommendation_result_id uuid not null unique references public.recommendation_results(id) on delete cascade,
  summary_text text not null,
  full_text text,
  model text,
  prompt_version text,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- INDEXES
-- ============================================================================
-- 조회 빈도가 높은 쿼리 패턴을 고려한 인덱스
-- - 사용자별 향수 목록 조회 (최신순)
-- - 사용자별 추천 결과 조회 (최신순)
-- - 향수별 추천 결과 조회 (최신순)

-- 사용자별 향수 목록 조회 최적화 (대시보드, 향수 관리 페이지)
create index idx_user_perfumes_user_updated_at
  on public.user_perfumes (user_id, updated_at desc);

-- 사용자별 추천 결과 조회 최적화 (추천 결과 페이지)
create index idx_recommendation_results_user_created_at
  on public.recommendation_results (user_id, created_at desc);

-- 향수별 추천 결과 조회 최적화 (향수 상세 페이지에서 최신 추천 결과 조회)
create index idx_recommendation_results_perfume_created_at
  on public.recommendation_results (user_perfume_id, created_at desc);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================
-- 모든 public 테이블에 RLS 활성화
-- 사용자는 자신의 데이터만 조회/수정/삭제 가능

alter table public.profiles enable row level security;
alter table public.user_preferences enable row level security;
alter table public.user_perfumes enable row level security;
alter table public.recommendation_results enable row level security;
alter table public.ai_explanations enable row level security;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- profiles policies
-- ----------------------------------------------------------------------------
-- 사용자는 자신의 프로필만 조회/생성/수정 가능

create policy "profiles_select_own"
on public.profiles
for select
using (auth.uid() = id);

create policy "profiles_insert_own"
on public.profiles
for insert
with check (auth.uid() = id);

create policy "profiles_update_own"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- ----------------------------------------------------------------------------
-- user_preferences policies
-- ----------------------------------------------------------------------------
-- 사용자는 자신의 취향 데이터만 조회/생성/수정/삭제 가능

create policy "user_preferences_select_own"
on public.user_preferences
for select
using (auth.uid() = user_id);

create policy "user_preferences_insert_own"
on public.user_preferences
for insert
with check (auth.uid() = user_id);

create policy "user_preferences_update_own"
on public.user_preferences
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "user_preferences_delete_own"
on public.user_preferences
for delete
using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- user_perfumes policies
-- ----------------------------------------------------------------------------
-- 사용자는 자신이 보유한 향수만 조회/생성/수정/삭제 가능

create policy "user_perfumes_select_own"
on public.user_perfumes
for select
using (auth.uid() = user_id);

create policy "user_perfumes_insert_own"
on public.user_perfumes
for insert
with check (auth.uid() = user_id);

create policy "user_perfumes_update_own"
on public.user_perfumes
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "user_perfumes_delete_own"
on public.user_perfumes
for delete
using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- recommendation_results policies
-- ----------------------------------------------------------------------------
-- 사용자는 자신의 추천 결과만 조회/생성 가능
-- 수정/삭제는 기본적으로 허용하지 않음 (히스토리 보존 목적)

create policy "recommendation_results_select_own"
on public.recommendation_results
for select
using (auth.uid() = user_id);

create policy "recommendation_results_insert_own"
on public.recommendation_results
for insert
with check (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- ai_explanations policies
-- ----------------------------------------------------------------------------
-- 사용자는 자신이 소유한 추천 결과에 대한 AI 설명만 조회/생성 가능
-- recommendation_results의 소유권을 통해 간접적으로 검증

create policy "ai_explanations_select_via_recommendation_owner"
on public.ai_explanations
for select
using (
  exists (
    select 1
    from public.recommendation_results rr
    where rr.id = ai_explanations.recommendation_result_id
      and rr.user_id = auth.uid()
  )
);

create policy "ai_explanations_insert_via_recommendation_owner"
on public.ai_explanations
for insert
with check (
  exists (
    select 1
    from public.recommendation_results rr
    where rr.id = ai_explanations.recommendation_result_id
      and rr.user_id = auth.uid()
  )
);

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
-- 
-- 스키마 생성 완료 후 확인 사항:
-- 1. 모든 테이블이 정상적으로 생성되었는지 확인
--    SELECT table_name FROM information_schema.tables 
--    WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
-- 
-- 2. RLS가 활성화되었는지 확인
--    SELECT tablename, rowsecurity FROM pg_tables 
--    WHERE schemaname = 'public';
-- 
-- 3. 인덱스가 생성되었는지 확인
--    SELECT indexname, tablename FROM pg_indexes 
--    WHERE schemaname = 'public';
-- 
-- 4. 타입 정의 동기화
--    Supabase CLI로 타입 생성: 
--    npx supabase gen types typescript --project-id <project-id> > types/database.ts
-- 
-- ============================================================================
