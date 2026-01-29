import { createClient } from '@/lib/supabase/server';

export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { ok: false as const, status: 401 as const, supabase, user: null };
  }

  return { ok: true as const, status: 200 as const, supabase, user };
}

/**
 * `profiles`는 `user_preferences.user_id` / `user_perfumes.user_id`의 FK 타겟.
 * 운영상 "프로필이 없어서 쓰기 실패"를 막기 위해, API mutation 전에 최소 프로필을 보장한다.
 *
 * 정책:
 * - 이미 있으면 noop
 * - 없으면 (id=user.id)로 최소 row 생성 (RLS: profiles_insert_own)
 */
export async function ensureProfileRow(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle();

  if (existing?.id) return;

  await supabase.from('profiles').insert({ id: userId });
}

