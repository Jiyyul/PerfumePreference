"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { RecommendationWithPerfume } from "@/types/api";

export interface RecommendationResultCardProps {
  recommendation: RecommendationWithPerfume;
}

/**
 * "결과(추천/비추천)" + "점수" + "이유"를 표시하는 카드
 * 
 * PRD 원칙:
 * - 추천 판단 주체는 규칙 기반
 * - AI 설명은 별도 컴포넌트에서 처리 (F5에서 구현)
 */
export function RecommendationResultCard({ recommendation }: RecommendationResultCardProps) {
  const isRecommended = recommendation.verdict === 'recommend';
  const perfume = recommendation.user_perfumes;

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
        {perfume.notes_top.length > 0 && (
          <div>
            <span className="font-medium text-gray-700">Top: </span>
            <span className="text-gray-600">{perfume.notes_top.join(', ')}</span>
          </div>
        )}
        {perfume.notes_middle.length > 0 && (
          <div>
            <span className="font-medium text-gray-700">Middle: </span>
            <span className="text-gray-600">{perfume.notes_middle.join(', ')}</span>
          </div>
        )}
        {perfume.notes_base.length > 0 && (
          <div>
            <span className="font-medium text-gray-700">Base: </span>
            <span className="text-gray-600">{perfume.notes_base.join(', ')}</span>
          </div>
        )}
      </div>

      {/* 추천 이유 (규칙 기반) */}
      <div className="border-t pt-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">분석 근거</h3>
        <ul className="space-y-1">
          {recommendation.reasons.map((reason, idx) => (
            <li key={idx} className="text-sm text-gray-600 flex items-start">
              <span className="mr-2 text-gray-400">•</span>
              <span>{reason}</span>
            </li>
          ))}
        </ul>
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

