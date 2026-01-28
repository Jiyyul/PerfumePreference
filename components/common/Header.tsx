"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

const LOGO_TEXT = "Scentory";

export function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-card/50 backdrop-blur-sm">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className={cn(
            "font-serif text-2xl font-medium text-foreground transition-colors",
            "hover:opacity-80"
          )}
        >
          {LOGO_TEXT}
        </Link>
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground"
        >
          <Link href="/dashboard/preferences">
            <Settings className="w-4 h-4 mr-2" />
            Preferences
          </Link>
        </Button>
      </div>
    </header>
  );
}
