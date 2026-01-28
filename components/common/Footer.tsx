"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

const LOGO_TEXT = "Scentory";

const FOOTER_LINKS = [
  { label: "취향 입력", href: "/dashboard/preferences" },
  { label: "향수 관리", href: "/dashboard/perfumes" },
  { label: "분석/설명", href: "/dashboard/recommendations" },
] as const;

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/30">
      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} {LOGO_TEXT}
            </p>
            <p className="text-xs text-muted-foreground/80">
              취향을 구조화하고, 추천 결과를 “설명”합니다.
            </p>
          </div>
          <nav
            className="flex flex-wrap items-center justify-center gap-6"
            aria-label="푸터 메뉴"
          >
            {FOOTER_LINKS.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "text-xs text-muted-foreground transition-colors",
                  "hover:text-foreground"
                )}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
