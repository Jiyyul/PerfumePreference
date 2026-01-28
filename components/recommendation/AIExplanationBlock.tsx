"use client";

import * as React from "react";

export interface AIExplanationBlockProps {
  title: string;
  subtitle?: string;
  explanation: string;
}

export function AIExplanationBlock({
  title,
  subtitle,
  explanation,
}: AIExplanationBlockProps) {
  return (
    <section className="mb-12">
      <div className="mb-6">
        <h2 className="mb-2 font-serif text-xl font-medium text-foreground">
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            {subtitle}
          </p>
        )}
      </div>

      <div className="rounded-lg border border-border bg-card p-6 md:p-8">
        <p className="text-base leading-relaxed text-foreground md:text-lg">
          {explanation}
        </p>
      </div>
    </section>
  );
}

