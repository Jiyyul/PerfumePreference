"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "outline" | "destructive";
  size?: "sm" | "md" | "lg";
}

const variantStyles = {
  default: "bg-foreground text-background",
  secondary: "bg-secondary text-secondary-foreground",
  outline: "border border-border bg-transparent text-foreground",
  destructive: "bg-destructive/10 text-destructive border border-destructive/30",
} as const;

const sizeStyles = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-xs",
  lg: "px-3 py-1.5 text-sm",
} as const;

const Chip = React.forwardRef<HTMLSpanElement, ChipProps>(
  ({ className, variant = "default", size = "md", ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-full font-medium transition-colors",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      />
    );
  }
);
Chip.displayName = "Chip";

export { Chip };
