'use client';

/**
 * 인증 관련 커스텀 훅
 */
export function useAuth() {
  // Supabase auth 상태 관리 및 로그인/로그아웃 로직 구현 예정
  return {
    user: null,
    isLoading: false,
    signIn: async () => {},
    signOut: async () => {},
  };
}
