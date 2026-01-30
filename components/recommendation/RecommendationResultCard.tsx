"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { RecommendationWithPerfume } from "@/types/api";
import type { Database } from "@/types/database";

export interface RecommendationResultCardProps {
  recommendation: RecommendationWithPerfume;
}

/**
 * "결과(추천/비추천)" + "점수" + "이유"를 표시하는 카드
 * 
 * PRD 원칙:
 * - 추천 판단 주체는 규칙 기반
 * - AI 설명은 버튼 클릭 시 생성/표시
 */
export function RecommendationResultCard({ recommendation }: RecommendationResultCardProps) {
  const isRecommended = recommendation.verdict === 'recommend';
  const perfume = recommendation.user_perfumes;

  // AI 설명 관련 상태
  const [showExplanation, setShowExplanation] = React.useState(false);
  const [isLoadingExplanation, setIsLoadingExplanation] = React.useState(false);
  const [explanationError, setExplanationError] = React.useState<string | null>(null);
  const [explanation, setExplanation] = React.useState<Database['public']['Tables']['ai_explanations']['Row'] | null>(null);

  // 향수 데이터 없으면 렌더링 중단 (안전 장치)
  if (!perfume) {
    return null;
  }

  // notes 안전 처리
  const notesTop = perfume.notes_top || [];
  const notesMiddle = perfume.notes_middle || [];
  const notesBase = perfume.notes_base || [];
  const reasons = recommendation.reasons || [];

  // AI 설명 생성/조회 함수
  const handleExplainClick = async () => {
    // 이미 표시 중이면 토글
    if (showExplanation) {
      setShowExplanation(false);
      return;
    }

    // 이미 설명이 있으면 즉시 표시
    if (explanation) {
      setShowExplanation(true);
      return;
    }

    // 설명 생성 요청
    setIsLoadingExplanation(true);
    setExplanationError(null);

    try {
      const response = await fetch(`/api/recommendations/${recommendation.id}/explain`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        
        // Quota Exceeded 특별 처리
        if (errorData.error?.includes('할당량')) {
          throw new Error('AI 서비스 할당량이 초과되었습니다. 잠시 후 다시 시도해 주세요.');
        }
        
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      if (result.data) {
        setExplanation(result.data);
        setShowExplanation(true);
      } else {
        throw new Error('설명 데이터가 없습니다.');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'AI 설명 생성에 실패했습니다.';
      setExplanationError(message);
      console.error('[RecommendationResultCard] AI explanation error:', err);
    } finally {
      setIsLoadingExplanation(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-xl font-semibold">{perfume.name}</h2>
            <Badge
              className={
                isRecommended
                  ? "bg-green-100 text-green-800 hover:bg-green-100"
                  : "bg-gray-100 text-gray-800 hover:bg-gray-100"
              }
            >
              {isRecommended ? "추천" : "비추천"}
            </Badge>
          </div>
          <p className="text-sm text-gray-600 mb-1">{perfume.brand}</p>
          <p className="text-sm text-gray-500">
            {perfume.family} · {perfume.mood}
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-600">
            {recommendation.score}
          </div>
          <div className="text-xs text-gray-500">점수</div>
        </div>
      </div>

      {/* 향수 노트 정보 */}
      <div className="mb-4 space-y-2 text-sm">
        {notesTop.length > 0 && (
          <div>
            <span className="font-medium text-gray-700">Top: </span>
            <span className="text-gray-600">{notesTop.join(', ')}</span>
          </div>
        )}
        {notesMiddle.length > 0 && (
          <div>
            <span className="font-medium text-gray-700">Middle: </span>
            <span className="text-gray-600">{notesMiddle.join(', ')}</span>
          </div>
        )}
        {notesBase.length > 0 && (
          <div>
            <span className="font-medium text-gray-700">Base: </span>
            <span className="text-gray-600">{notesBase.join(', ')}</span>
          </div>
        )}
      </div>

      {/* 추천 이유 (규칙 기반) */}
      <div className="border-t pt-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">분석 근거</h3>
        {reasons.length > 0 ? (
          <ul className="space-y-1">
            {reasons.map((reason, idx) => (
              <li key={idx} className="text-sm text-gray-600 flex items-start">
                <span className="mr-2 text-gray-400">•</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">분석 근거 정보 없음</p>
        )}
      </div>

      {/* AI 설명 버튼 */}
      <div className="mt-4 pt-4 border-t">
        <button
          onClick={handleExplainClick}
          disabled={isLoadingExplanation}
          className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {isLoadingExplanation ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>AI 설명 생성 중...</span>
            </>
          ) : showExplanation ? (
            '설명 숨기기'
          ) : (
            'AI 설명 보기'
          )}
        </button>

        {/* 에러 메시지 */}
        {explanationError && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-700">{explanationError}</p>
            <button
              onClick={handleExplainClick}
              className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
            >
              다시 시도
            </button>
          </div>
        )}

        {/* AI 설명 표시 */}
        {showExplanation && explanation && (
          <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-md">
            <h4 className="text-sm font-semibold text-purple-900 mb-2">AI 설명</h4>
            
            {/* 요약 */}
            <div className="mb-3">
              <p className="text-sm font-medium text-purple-800 mb-1">요약</p>
              <p className="text-sm text-gray-700 leading-relaxed">{explanation.summary_text}</p>
            </div>

            {/* 상세 설명 */}
            {explanation.full_text && (
              <div>
                <p className="text-sm font-medium text-purple-800 mb-1">상세 설명</p>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                  {explanation.full_text}
                </p>
              </div>
            )}

            {/* 메타 정보 */}
            <div className="mt-3 pt-3 border-t border-purple-200 text-xs text-purple-600">
              모델: {explanation.model || 'gemini-2.0-flash-exp'} · 
              생성일: {new Date(explanation.created_at).toLocaleDateString('ko-KR')}
            </div>
          </div>
        )}
      </div>

      {/* 규칙 버전 표시 */}
      <div className="mt-4 pt-4 border-t text-xs text-gray-400">
        규칙 버전: {recommendation.rule_version} · 생성일:{' '}
        {new Date(recommendation.created_at).toLocaleDateString('ko-KR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </div>
    </Card>
  );
}

