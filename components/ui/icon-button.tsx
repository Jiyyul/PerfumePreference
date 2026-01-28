"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button, type ButtonProps } from "./button";

export interface IconButtonProps extends ButtonProps {
  "aria-label": string;
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, size = "icon", ...props }, ref) => {
    return (
      <Button
        ref={ref}
        size={size}
        className={cn("aspect-square", className)}
        {...props}
      />
    );
  }
);
IconButton.displayName = "IconButton";

export { IconButton };
