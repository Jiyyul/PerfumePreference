/**
 * 데이터베이스 스키마 타입
 * 
 * Supabase CLI로 생성된 타입을 여기에 통합:
 * npx supabase gen types typescript --project-id <project-id> > types/database.ts
 * 
 * 또는 수동으로 정의:
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Enums: {
      recommendation_verdict: 'recommend' | 'not_recommend';
    };
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_perfumes: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          brand: string;
          notes_top: string[];
          notes_middle: string[];
          notes_base: string[];
          family: string;
          mood: string;
          usage_context: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          brand: string;
          notes_top?: string[];
          notes_middle?: string[];
          notes_base?: string[];
          family: string;
          mood: string;
          usage_context?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          brand?: string;
          notes_top?: string[];
          notes_middle?: string[];
          notes_base?: string[];
          family?: string;
          mood?: string;
          usage_context?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_preferences: {
        Row: {
          id: string;
          user_id: string;
          preferred_notes: string[];
          disliked_notes: string[];
          usage_context: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          preferred_notes?: string[];
          disliked_notes?: string[];
          usage_context?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          preferred_notes?: string[];
          disliked_notes?: string[];
          usage_context?: string[];
          created_at?: string;
          updated_at?: string;
        };
      };
      recommendation_results: {
        Row: {
          id: string;
          user_id: string;
          user_perfume_id: string;
          verdict: Database['public']['Enums']['recommendation_verdict'];
          score: number;
          reasons: string[];
          rule_version: string;
          input_snapshot: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          user_perfume_id: string;
          verdict: Database['public']['Enums']['recommendation_verdict'];
          score: number;
          reasons?: string[];
          rule_version?: string;
          input_snapshot?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          user_perfume_id?: string;
          verdict?: Database['public']['Enums']['recommendation_verdict'];
          score?: number;
          reasons?: string[];
          rule_version?: string;
          input_snapshot?: Json;
          created_at?: string;
        };
      };
      ai_explanations: {
        Row: {
          id: string;
          recommendation_result_id: string;
          summary_text: string;
          full_text: string | null;
          model: string | null;
          prompt_version: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          recommendation_result_id: string;
          summary_text: string;
          full_text?: string | null;
          model?: string | null;
          prompt_version?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          recommendation_result_id?: string;
          summary_text?: string;
          full_text?: string | null;
          model?: string | null;
          prompt_version?: string | null;
          created_at?: string;
        };
      };
    };
  };
}
