"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { AIExplanationBlock } from "./AIExplanationBlock";

export interface RecommendationResultCardPerfume {
  name: string;
  brand: string;
  aiExplanation: string;
  fullExplanation?: string;
  isRecommended?: boolean;
}

export interface RecommendationResultCardProps {
  perfume: RecommendationResultCardPerfume;
}

/**
 * "결과(추천/비추천)" + "설명(AI)"을 한 화면에 함께 보여주는 카드.
 * - 추천 판단 주체는 규칙 기반이며, AI는 보조 설명 역할이라는 전제를 유지한다.
 */
export function RecommendationResultCard({ perfume }: RecommendationResultCardProps) {
  const isRecommended = perfume.isRecommended ?? true;
  const explanation = perfume.fullExplanation || perfume.aiExplanation;

  return (
    <section className="mb-12">
      <div className="mb-12 text-center">
        <p className="mb-2 text-sm text-muted-foreground">{perfume.brand}</p>
        <h1 className="mb-6 font-serif text-4xl font-medium text-foreground md:text-5xl">
          {perfume.name}
        </h1>

        <div className="inline-flex items-center gap-3">
          <Badge
            className={
              isRecommended
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground"
            }
          >
            {isRecommended ? "Recommended" : "Not for you"}
          </Badge>
          <p className="text-xs text-muted-foreground">
            판단은 규칙 기반이며, 아래 설명은 보조 해설입니다.
          </p>
        </div>
      </div>

      <div className="mb-12 h-px w-full bg-border" />

      <AIExplanationBlock
        title={isRecommended ? "Our Analysis" : "Our Analysis"}
        subtitle={`Why this ${isRecommended ? "works" : "may not work"} for you`}
        explanation={explanation}
      />
    </section>
  );
}

