'use client';

/**
 * 취향 데이터 관리 커스텀 훅
 */
export function usePreferences() {
  // 선호/비선호 노트, 사용 상황 관리 로직 구현 예정
  return {
    preferences: null,
    isLoading: false,
    error: null,
    updatePreferences: async () => {},
  };
}
