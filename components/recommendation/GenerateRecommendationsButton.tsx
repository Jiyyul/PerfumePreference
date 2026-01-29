'use client';

import { useState } from 'react';

export interface GenerateRecommendationsButtonProps {
  perfumeCount: number;
}

/**
 * 추천 생성 버튼 (Client Component)
 * 
 * 역할: POST /api/recommendations/generate 호출
 */
export function GenerateRecommendationsButton({ perfumeCount }: GenerateRecommendationsButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/recommendations/generate', {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      // 성공 시 페이지 새로고침 (Server Component 재조회)
      window.location.reload();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate recommendations';
      setError(message);
      console.error('[GenerateRecommendationsButton] error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="mb-6">
      <button
        onClick={handleGenerate}
        disabled={isGenerating}
        className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {isGenerating ? '생성 중...' : `추천 생성 (${perfumeCount}개 향수 분석)`}
      </button>
      {error && (
        <p className="mt-2 text-sm text-red-600">
          오류: {error}
        </p>
      )}
    </div>
  );
}
