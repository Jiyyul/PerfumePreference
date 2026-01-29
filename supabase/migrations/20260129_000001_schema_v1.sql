-- Schema v1 for Scentory (Supabase / Postgres)
-- - UI-driven fields first (brand, structured notes, explanation summary/full)
-- - Rule-engine is the decision maker; AI stores explanations as assets
-- - Adds minimal reproducibility metadata for recommendations

-- Extensions
create extension if not exists "pgcrypto";

-- Enums
do $$
begin
  create type public.recommendation_verdict as enum ('recommend', 'not_recommend');
exception
  when duplicate_object then null;
end
$$;

-- Common trigger for updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- profiles (1:1 with auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_profiles_set_updated_at on public.profiles;
create trigger trg_profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

-- user_preferences (1:1 per user)
create table if not exists public.user_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  preferred_notes text[] not null default '{}'::text[],
  disliked_notes text[] not null default '{}'::text[],
  usage_context text[] not null default '{}'::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_user_preferences_set_updated_at on public.user_preferences;
create trigger trg_user_preferences_set_updated_at
before update on public.user_preferences
for each row
execute function public.set_updated_at();

-- user_perfumes (owned perfumes; UI requires brand + structured notes)
create table if not exists public.user_perfumes (
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

drop trigger if exists trg_user_perfumes_set_updated_at on public.user_perfumes;
create trigger trg_user_perfumes_set_updated_at
before update on public.user_perfumes
for each row
execute function public.set_updated_at();

-- recommendation_results (rule-engine decision output; stores reproducibility metadata)
create table if not exists public.recommendation_results (
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

-- ai_explanations (1:1 with recommendation_results; summary/full for UI)
create table if not exists public.ai_explanations (
  id uuid primary key default gen_random_uuid(),
  recommendation_result_id uuid not null unique references public.recommendation_results(id) on delete cascade,
  summary_text text not null,
  full_text text,
  model text,
  prompt_version text,
  created_at timestamptz not null default now()
);

-- Indexes (query patterns: per-user, latest-first)
create index if not exists idx_user_perfumes_user_updated_at
  on public.user_perfumes (user_id, updated_at desc);

create index if not exists idx_recommendation_results_user_created_at
  on public.recommendation_results (user_id, created_at desc);

create index if not exists idx_recommendation_results_perfume_created_at
  on public.recommendation_results (user_perfume_id, created_at desc);

-- RLS
alter table public.profiles enable row level security;
alter table public.user_preferences enable row level security;
alter table public.user_perfumes enable row level security;
alter table public.recommendation_results enable row level security;
alter table public.ai_explanations enable row level security;

-- Policies: profiles
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- Policies: user_preferences
drop policy if exists "user_preferences_select_own" on public.user_preferences;
create policy "user_preferences_select_own"
on public.user_preferences
for select
using (auth.uid() = user_id);

drop policy if exists "user_preferences_insert_own" on public.user_preferences;
create policy "user_preferences_insert_own"
on public.user_preferences
for insert
with check (auth.uid() = user_id);

drop policy if exists "user_preferences_update_own" on public.user_preferences;
create policy "user_preferences_update_own"
on public.user_preferences
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "user_preferences_delete_own" on public.user_preferences;
create policy "user_preferences_delete_own"
on public.user_preferences
for delete
using (auth.uid() = user_id);

-- Policies: user_perfumes
drop policy if exists "user_perfumes_select_own" on public.user_perfumes;
create policy "user_perfumes_select_own"
on public.user_perfumes
for select
using (auth.uid() = user_id);

drop policy if exists "user_perfumes_insert_own" on public.user_perfumes;
create policy "user_perfumes_insert_own"
on public.user_perfumes
for insert
with check (auth.uid() = user_id);

drop policy if exists "user_perfumes_update_own" on public.user_perfumes;
create policy "user_perfumes_update_own"
on public.user_perfumes
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "user_perfumes_delete_own" on public.user_perfumes;
create policy "user_perfumes_delete_own"
on public.user_perfumes
for delete
using (auth.uid() = user_id);

-- Policies: recommendation_results
drop policy if exists "recommendation_results_select_own" on public.recommendation_results;
create policy "recommendation_results_select_own"
on public.recommendation_results
for select
using (auth.uid() = user_id);

drop policy if exists "recommendation_results_insert_own" on public.recommendation_results;
create policy "recommendation_results_insert_own"
on public.recommendation_results
for insert
with check (auth.uid() = user_id);

-- Policies: ai_explanations (access via ownership of recommendation_results)
drop policy if exists "ai_explanations_select_via_recommendation_owner" on public.ai_explanations;
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

drop policy if exists "ai_explanations_insert_via_recommendation_owner" on public.ai_explanations;
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

