"use client";

import { useAuth } from "@/hooks/use-auth";

/**
 * F1 검증 페이지: 사용자 프로필 조회 테스트
 */
export default function ProfileTestPage() {
  const { mode, user, profile, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <h1 className="text-2xl font-bold mb-4">F1 Profile Test</h1>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-bold mb-6">F1: 사용자 프로필 조회 테스트</h1>

      <div className="space-y-6">
        {/* Auth Mode */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="text-lg font-semibold mb-2">Auth Mode</h2>
          <p className="text-sm">
            <span className="font-mono">{mode}</span>
            {mode === "mock" && (
              <span className="ml-2 text-xs text-muted-foreground">
                (Supabase env vars not configured)
              </span>
            )}
          </p>
        </div>

        {/* User (auth.users) */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="text-lg font-semibold mb-2">User (auth.users)</h2>
          {user ? (
            <pre className="text-xs overflow-auto">
              {JSON.stringify(user, null, 2)}
            </pre>
          ) : (
            <p className="text-sm text-muted-foreground">No user logged in</p>
          )}
        </div>

        {/* Profile (profiles table) */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="text-lg font-semibold mb-2">
            Profile (profiles table) ✨
          </h2>
          {profile ? (
            <div className="space-y-2">
              <pre className="text-xs overflow-auto bg-muted p-3 rounded">
                {JSON.stringify(profile, null, 2)}
              </pre>
              <div className="mt-4 space-y-1">
                <p className="text-sm">
                  <span className="font-semibold">ID:</span>{" "}
                  <span className="font-mono text-xs">{profile.id}</span>
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Display Name:</span>{" "}
                  <span className="font-mono text-xs">
                    {profile.display_name ?? "(null)"}
                  </span>
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Avatar URL:</span>{" "}
                  <span className="font-mono text-xs">
                    {profile.avatar_url ?? "(null)"}
                  </span>
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Created:</span>{" "}
                  <span className="font-mono text-xs">
                    {new Date(profile.created_at).toLocaleString()}
                  </span>
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No profile found (may need to create profiles row for this user)
            </p>
          )}
        </div>

        {/* Test Result Summary */}
        <div className="rounded-lg border border-green-500/50 bg-green-500/10 p-4">
          <h2 className="text-lg font-semibold mb-2 text-green-700 dark:text-green-300">
            ✅ F1 Test Result
          </h2>
          <div className="space-y-1 text-sm">
            <p>
              ✓ <span className="font-semibold">user</span> field:{" "}
              {user ? "✅ Present" : "❌ Missing"}
            </p>
            <p>
              ✓ <span className="font-semibold">profile</span> field:{" "}
              {profile ? "✅ Present" : "⚠️ Not found (expected if no DB row)"}
            </p>
            <p>
              ✓ <span className="font-semibold">profile.display_name</span>:{" "}
              {profile?.display_name ? (
                <span className="font-mono text-xs">{profile.display_name}</span>
              ) : (
                "(null)"
              )}
            </p>
          </div>
        </div>

        {/* Instructions */}
        <div className="rounded-lg border border-blue-500/50 bg-blue-500/10 p-4">
          <h2 className="text-lg font-semibold mb-2 text-blue-700 dark:text-blue-300">
            📝 Test Instructions
          </h2>
          <ul className="text-sm space-y-1 list-disc list-inside">
            <li>
              <span className="font-semibold">Mock Mode:</span> profile은 자동 생성됨
              (display_name = email prefix)
            </li>
            <li>
              <span className="font-semibold">Supabase Mode:</span> profiles 테이블에서 조회
              (RLS 정책 적용)
            </li>
            <li>
              profile이 null이면 ensureProfileRow()로 생성되었는지 DB 확인 필요
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
