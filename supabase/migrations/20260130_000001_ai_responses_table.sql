-- ============================================================================
-- AI Chatbot Responses Table
-- ============================================================================
-- 
-- 목적: AI 챗봇 대화 로그 저장
-- 
-- 변경 이유:
-- - AI 챗봇 기능 추가로 사용자 질문과 AI 답변을 저장
-- - 비용 절감 및 대화 이력 관리
-- - 기존 ai_explanations 테이블과 완전히 분리 (다른 용도)
-- 
-- 영향도:
-- - 기존 테이블 및 로직에 영향 없음 (완전히 새로운 테이블)
-- - RLS 정책으로 사용자별 데이터 격리
-- 
-- 실행 방법:
-- Supabase Dashboard → SQL Editor → 이 파일 실행
-- 
-- ============================================================================

-- ----------------------------------------------------------------------------
-- ai_responses 테이블 생성
-- ----------------------------------------------------------------------------
-- 역할: AI 챗봇 대화 로그 저장
-- 목적:
--   - 사용자 질문(prompt)과 AI 답변(response) 저장
--   - 사용된 AI provider 기록 (google, groq)
--   - 카테고리별 분류 (chatbot, recommendation 등)
--   - 비용 분석 및 사용 패턴 추적
-- 관계: profiles(id) ←→ ai_responses(user_id) [1:N, CASCADE, NULLABLE]

create table if not exists public.ai_responses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  prompt text not null,
  response text not null,
  provider text not null, -- 'google', 'groq', etc.
  category text not null default 'chatbot', -- 'chatbot', 'recommendation', etc.
  latency_ms integer, -- 응답 시간 (밀리초)
  created_at timestamptz not null default now()
);

-- 인덱스: 사용자별 대화 이력 조회 최적화
create index if not exists idx_ai_responses_user_created_at
  on public.ai_responses (user_id, created_at desc);

-- 인덱스: 카테고리별 조회 최적화
create index if not exists idx_ai_responses_category_created_at
  on public.ai_responses (category, created_at desc);

-- 인덱스: Provider별 통계 조회 최적화
create index if not exists idx_ai_responses_provider
  on public.ai_responses (provider);

-- ----------------------------------------------------------------------------
-- RLS (Row Level Security) 설정
-- ----------------------------------------------------------------------------
-- 모든 사용자는 자신의 대화 이력만 조회/생성 가능
-- user_id가 NULL인 경우(비인증 사용자)는 조회/생성 모두 허용하지 않음

alter table public.ai_responses enable row level security;

-- 조회: 자신의 대화만 조회 가능
create policy "ai_responses_select_own"
on public.ai_responses
for select
using (
  auth.uid() = user_id
);

-- 생성: 자신의 대화만 생성 가능
create policy "ai_responses_insert_own"
on public.ai_responses
for insert
with check (
  auth.uid() = user_id
);

-- 참고: UPDATE와 DELETE는 의도적으로 제한 (대화 이력 보존 목적)
-- 필요 시 admin 권한으로만 수정/삭제 가능

-- ============================================================================
-- 검증 쿼리
-- ============================================================================
-- 테이블 생성 확인
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' AND table_name = 'ai_responses';

-- RLS 활성화 확인
-- SELECT tablename, rowsecurity FROM pg_tables 
-- WHERE schemaname = 'public' AND tablename = 'ai_responses';

-- 인덱스 확인
-- SELECT indexname, tablename FROM pg_indexes 
-- WHERE schemaname = 'public' AND tablename = 'ai_responses';

-- ============================================================================
-- 롤백 SQL (필요 시)
-- ============================================================================
-- DROP TABLE IF EXISTS public.ai_responses CASCADE;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
