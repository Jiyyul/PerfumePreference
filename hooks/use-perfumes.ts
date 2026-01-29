'use client';

/**
 * 향수 데이터 관리 커스텀 훅
 */
export function usePerfumes() {
  // TODO(Phase 3): 캐시/로딩 상태 고도화
  return {
    perfumes: [],
    isLoading: false,
    error: null as string | null,
    listPerfumes: async () => {
      const res = await fetch('/api/perfumes', { method: 'GET' });
      return await res.json();
    },
    addPerfume: async (input: unknown) => {
      const res = await fetch('/api/perfumes', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(input),
      });
      return await res.json();
    },
    updatePerfume: async (id: string, input: unknown) => {
      const res = await fetch(`/api/perfumes/${id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(input),
      });
      return await res.json();
    },
    deletePerfume: async (id: string) => {
      const res = await fetch(`/api/perfumes/${id}`, { method: 'DELETE' });
      return await res.json();
    },
  };
}
