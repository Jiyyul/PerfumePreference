"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const LOGO_TEXT = "Scentory";

export function Header() {
  const router = useRouter();
  const { mode, user, profile, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    router.refresh(); // UI 상태 즉시 갱신
    router.push("/login"); // 로그인 페이지로 이동
  };

  // 프로필 이미지 URL 가져오기 (우선순위: user_metadata > profile.avatar_url > 기본 이니셜)
  const getAvatarUrl = () => {
    if (!user) return null;
    
    // Mock user의 경우
    if ('avatar' in user && typeof user.avatar === 'string') {
      return user.avatar;
    }

    // Supabase user의 경우 user_metadata에서 가져오기
    const metadata = user.user_metadata;
    if (metadata?.avatar_url) return metadata.avatar_url;
    if (metadata?.picture) return metadata.picture;

    // profiles 테이블의 avatar_url
    if (profile?.avatar_url) return profile.avatar_url;

    // 기본 이니셜 아바타
    const displayName = getDisplayName();
    return `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(displayName)}`;
  };

  // 표시할 이름 가져오기
  const getDisplayName = () => {
    if (!user) return 'User';

    // Mock user의 경우
    if ('name' in user && typeof user.name === 'string') {
      return user.name;
    }

    // Supabase user의 경우
    const metadata = user.user_metadata;
    if (metadata?.full_name) return metadata.full_name;
    if (metadata?.name) return metadata.name;
    if (profile?.display_name) return profile.display_name;
    if (user.email) return user.email.split('@')[0];
    return 'User';
  };

  const avatarUrl = getAvatarUrl();
  const displayName = getDisplayName();

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
          {user ? (
            <>
              {/* 프로필 영역 */}
              <div className="flex items-center gap-3">
                <div className="hidden items-end gap-1 text-right sm:flex sm:flex-col">
                  <p className="text-xs text-muted-foreground">
                    {mode === "mock" ? "Dev Mode · Mock Login" : "Supabase Session"}
                  </p>
                  <p className="text-xs text-foreground">{displayName}</p>
                </div>
                
                {/* 프로필 사진 */}
                {avatarUrl && (
                  <div className="relative h-8 w-8 overflow-hidden rounded-full border border-border">
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
              </div>

              {/* 로그아웃 버튼 */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="text-xs"
              >
                Logout
              </Button>
            </>
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
