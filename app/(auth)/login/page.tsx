"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export default function LoginPage() {
  const router = useRouter();
  const { mode, user, isLoading, signInWithGoogle } = useAuth();

  const handleGoogleLoginClick = () => {
    // Supabase 모드: OAuth redirect로 이동 (router push 불필요)
    // Mock 모드: 즉시 로그인 후 대시보드로 이동
    void signInWithGoogle();
    if (mode === "mock") router.push("/dashboard");
  };

  return (
    <main className="min-h-screen bg-background px-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-md">
        <div className="mb-10 text-center">
          <h1 className="mb-3 font-serif text-5xl font-medium tracking-tight text-foreground">
            Scentory
          </h1>
          <p className="mx-auto max-w-sm text-sm leading-relaxed text-muted-foreground">
            이 페이지는 OAuth 연동 전 단계에서 UI/UX와 플로우를 검증하기 위한{" "}
            <span className="font-medium text-foreground">Mock Login</span>입니다.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {mode === "mock"
              ? "Dev Mode · Mock Login (No Supabase)"
              : "Supabase OAuth Enabled"}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <Button
            type="button"
            onClick={handleGoogleLoginClick}
            disabled={isLoading}
            className="h-12 w-full bg-white text-neutral-900 hover:bg-neutral-50 border border-neutral-200"
          >
            <span className="mr-3 inline-flex h-5 w-5 items-center justify-center">
              {/* Inline Google "G" mark (no remote image dependency) */}
              <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                <path
                  fill="#FFC107"
                  d="M43.611 20.083H42V20H24v8h11.303C33.654 32.656 29.25 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.963 3.037l5.657-5.657C34.04 6.053 29.272 4 24 4 12.954 4 4 12.954 4 24s8.954 20 20 20 20-8.954 20-20c0-1.341-.138-2.65-.389-3.917z"
                />
                <path
                  fill="#FF3D00"
                  d="M6.306 14.691l6.571 4.819C14.655 16.108 19.001 12 24 12c3.059 0 5.842 1.154 7.963 3.037l5.657-5.657C34.04 6.053 29.272 4 24 4c-7.682 0-14.33 4.324-17.694 10.691z"
                />
                <path
                  fill="#4CAF50"
                  d="M24 44c5.148 0 9.836-1.977 13.389-5.197l-6.184-5.238C29.157 35.091 26.715 36 24 36c-5.229 0-9.62-3.317-11.283-7.946l-6.522 5.025C9.523 39.556 16.227 44 24 44z"
                />
                <path
                  fill="#1976D2"
                  d="M43.611 20.083H42V20H24v8h11.303c-.792 2.242-2.231 4.129-4.098 5.565l.003-.002 6.184 5.238C36.957 39.2 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
                />
              </svg>
            </span>
            Google로 로그인
          </Button>

          <div className="mt-4 rounded-lg bg-muted/40 p-3">
            <p className="text-xs text-muted-foreground">
              {mode === "mock" ? (
                <>
                  로그인 버튼은 실제 OAuth 호출 없이{" "}
                  <span className="font-medium text-foreground">가짜 사용자 객체</span>를
                  생성합니다.
                </>
              ) : (
                <>
                  로그인 버튼은 Supabase를 통해{" "}
                  <span className="font-medium text-foreground">Google OAuth</span>로
                  이동합니다.
                </>
              )}
            </p>
            <div className="mt-2 text-xs">
              <p className="text-muted-foreground">
                모드:{" "}
                <span className="font-medium text-foreground">{mode}</span>
              </p>
              {user && (
                <p className="text-muted-foreground">
                  사용자:{" "}
                  <span className="font-medium text-foreground">
                    {user.email ?? "(no email)"}
                  </span>
                </p>
              )}
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          이후 Supabase + Google OAuth를 붙이더라도 이 UI/라우팅 구조를 유지하는 것을 목표로 합니다.
        </p>
      </div>
    </main>
  );
}
