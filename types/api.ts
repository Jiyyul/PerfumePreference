/**
 * API 공통 타입 정의
 */

import type { Database } from './database';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// --- Domain: Perfumes / Preferences (Step 2)

export type PerfumeCreateInput = {
  name: string;
  brand: string;
  notes_top?: string[];
  notes_middle?: string[];
  notes_base?: string[];
  family: string;
  mood: string;
  usage_context?: string[] | null;
};

export type PerfumeUpdateInput = Partial<PerfumeCreateInput>;

export type PreferenceUpsertInput = {
  preferred_notes?: string[];
  disliked_notes?: string[];
  usage_context?: string[];
};

// --- Domain: Recommendations (Step 3)

export type RecommendationGenerateResponse = {
  count: number;
  results: Database['public']['Tables']['recommendation_results']['Row'][];
};

export type RecommendationWithPerfume = 
  Database['public']['Tables']['recommendation_results']['Row'] & {
    user_perfumes: Database['public']['Tables']['user_perfumes']['Row'];
  };

export type RecommendationWithDetails = 
  Database['public']['Tables']['recommendation_results']['Row'] & {
    user_perfumes: Database['public']['Tables']['user_perfumes']['Row'];
    ai_explanations: Database['public']['Tables']['ai_explanations']['Row'] | null;
  };

// --- Domain: AI Explanations (Step 3)

export type ExplanationGenerateResponse = {
  count: number;
  explanations: Database['public']['Tables']['ai_explanations']['Row'][];
};
