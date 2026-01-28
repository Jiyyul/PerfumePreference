"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { useMockAuth } from "@/lib/mock-auth";

const LOGO_TEXT = "Scentory";

export function Header() {
  const router = useRouter();
  const { status, user, logout } = useMockAuth();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

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
        <div className="flex items-center gap-3">
          <div className="hidden items-end gap-1 text-right sm:flex sm:flex-col">
            <p className="text-xs text-muted-foreground">
              Dev Mode · Mock Login
            </p>
            {status === "authenticated" && user ? (
              <p className="text-xs text-foreground">{user.email}</p>
            ) : (
              <p className="text-xs text-muted-foreground">Not signed in</p>
            )}
          </div>

          {status === "authenticated" ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="text-xs"
            >
              Logout
            </Button>
          ) : (
            <Link href="/login">
              <Button variant="outline" size="sm" className="text-xs">
                Login
              </Button>
            </Link>
          )}

          <Link href="/dashboard/preferences">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
            >
              <Settings className="w-4 h-4 mr-2" />
              Preferences
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
