'use client';

/**
 * 취향 데이터 관리 커스텀 훅
 */
export function usePreferences() {
  // TODO(Phase 3): 캐시/로딩 상태 고도화
  return {
    preferences: null,
    isLoading: false,
    error: null as string | null,
    getPreferences: async () => {
      const res = await fetch('/api/preferences', { method: 'GET' });
      return await res.json();
    },
    updatePreferences: async (input: unknown) => {
      const res = await fetch('/api/preferences', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(input),
      });
      return await res.json();
    },
  };
}
