'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database';
import type { RecommendationWithPerfume, RecommendationGenerateResponse } from '@/types/api';

/**
 * 추천 결과 관리 커스텀 훅
 * 
 * 기능:
 * - 추천 결과 조회 (recommendation_results + user_perfumes JOIN)
 * - 추천 생성 트리거 (규칙 엔진 실행)
 * - AI 설명 조회 (향후 확장)
 */
export function useRecommendations() {
  const [recommendations, setRecommendations] = useState<RecommendationWithPerfume[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 추천 결과 조회
   */
  const fetchRecommendations = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient<Database>();

      const { data, error: fetchError } = await supabase
        .from('recommendation_results')
        .select(`
          *,
          user_perfumes (*)
        `)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      // 타입 변환 (Supabase JOIN 결과 → RecommendationWithPerfume)
      const typedData = (data || []).map((item) => ({
        ...item,
        user_perfumes: Array.isArray(item.user_perfumes)
          ? item.user_perfumes[0]
          : item.user_perfumes,
      })) as RecommendationWithPerfume[];

      setRecommendations(typedData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch recommendations';
      setError(message);
      console.error('[useRecommendations] fetchRecommendations error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 추천 생성 (규칙 기반)
   */
  const generateRecommendations = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/recommendations/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result: { data: RecommendationGenerateResponse } = await response.json();

      // 생성 후 즉시 재조회
      await fetchRecommendations();

      return result.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate recommendations';
      setError(message);
      console.error('[useRecommendations] generateRecommendations error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * AI 설명 생성 (향후 구현)
   */
  const generateExplanations = async () => {
    // F5에서 구현 예정
    console.warn('[useRecommendations] generateExplanations not implemented yet');
  };

  /**
   * 초기 로드
   */
  useEffect(() => {
    fetchRecommendations();
  }, []);

  return {
    recommendations,
    isLoading,
    error,
    generateRecommendations,
    generateExplanations,
    refetch: fetchRecommendations,
  };
}
