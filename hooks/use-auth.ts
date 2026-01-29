'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useMockAuth } from '@/lib/mock-auth';
import type { Database } from '@/types/database';

type AuthUser = {
  id: string;
  email?: string | null;
  user_metadata?: {
    avatar_url?: string;
    picture?: string;
    full_name?: string;
    name?: string;
  };
};

type Profile = Database['public']['Tables']['profiles']['Row'];

/**
 * 인증 관련 커스텀 훅
 */
export function useAuth() {
  /**
   * NOTE
   * - Supabase env가 없는 개발 단계에서는 MockAuth(UI 플로우 검증용)를 계속 허용한다.
   * - env가 존재하면 Supabase 세션 기반으로 동작한다.
   *
   * Hook 규칙을 지키기 위해 MockAuth 훅은 항상 호출하고,
   * 실제 동작 모드만 env 유무로 분기한다.
   */
  const mock = useMockAuth();
  const supabaseConfigured = useMemo(() => {
    return (
      Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    );
  }, []);

  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(supabaseConfigured);

  useEffect(() => {
    if (!supabaseConfigured) return;
    const supabase = createClient();
    let unsub: (() => void) | null = null;
    let mounted = true;

    // Helper: profiles 테이블에서 프로필 조회
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

    (async () => {
      setIsLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (mounted) {
        setUser(user ?? null);
        await fetchProfile(user?.id ?? null);
      }

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (!mounted) return;
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        await fetchProfile(currentUser?.id ?? null);
      });
      unsub = () => subscription.unsubscribe();
      if (mounted) setIsLoading(false);
    })();

    return () => {
      mounted = false;
      unsub?.();
    };
  }, [supabaseConfigured]);

  if (!supabaseConfigured) {
    return {
      mode: 'mock' as const,
      user: mock.user,
      profile: mock.user
        ? {
            id: mock.user.id,
            display_name: mock.user.email?.split('@')[0] ?? 'Mock User',
            avatar_url: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        : null,
      isLoading: false,
      signInWithGoogle: async () => {
        mock.loginWithMockGoogle();
      },
      signOut: async () => {
        mock.logout();
      },
    };
  }

  return {
    mode: 'supabase' as const,
    user,
    profile,
    isLoading,
    signInWithGoogle: async () => {
      const supabase = createClient();
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
    },
    signOut: async () => {
      const supabase = createClient();
      await supabase.auth.signOut();
    },
  };
}
