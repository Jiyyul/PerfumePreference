"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";

export interface PerfumeCardPerfume {
  id: string;
  name: string;
  brand: string;
  notes: {
    top: string[];
    middle: string[];
    base: string[];
  };
  aiExplanation: string;
  fullExplanation?: string;
  isRecommended?: boolean;
}

export interface PerfumeCardProps {
  perfume: PerfumeCardPerfume;
  onSelect: () => void;
  onViewRecommendation: () => void;
}

export function PerfumeCard({
  perfume,
  onSelect,
  onViewRecommendation,
}: PerfumeCardProps) {
  const allNotes = [...perfume.notes.top, ...perfume.notes.middle.slice(0, 2)];

  return (
    <article
      className="group cursor-pointer rounded-lg border border-border bg-card p-6 transition-colors hover:border-foreground/20"
      onClick={onSelect}
    >
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="mb-1 font-serif text-xl font-medium text-foreground">
            {perfume.name}
          </h3>
          <p className="text-sm text-muted-foreground">{perfume.brand}</p>
        </div>

        {perfume.isRecommended !== undefined && (
          <Badge
            variant={perfume.isRecommended ? "default" : "secondary"}
            className={
              perfume.isRecommended
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground"
            }
          >
            {perfume.isRecommended ? "Recommended" : "Not for you"}
          </Badge>
        )}
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {allNotes.map((note) => (
          <span
            key={note}
            className="rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground"
          >
            {note}
          </span>
        ))}
      </div>

      <div className="mb-4">
        <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
          {perfume.aiExplanation}
        </p>
      </div>

      <div className="flex items-center gap-4 border-t border-border pt-4">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onViewRecommendation();
          }}
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          View Analysis
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Deep Dive
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    </article>
  );
}

