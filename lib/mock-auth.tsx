"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

export type MockUser = {
  id: string;
  name: string;
  email: string;
  avatar: string;
};

type AuthStatus = "authenticated" | "unauthenticated";

type MockAuthContextValue = {
  status: AuthStatus;
  user: MockUser | null;
  loginWithMockGoogle: () => MockUser;
  logout: () => void;
};

const MockAuthContext = createContext<MockAuthContextValue | null>(null);

function createMockUser(): MockUser {
  const seed = Math.random().toString(16).slice(2, 10);
  const id = `mock_${seed}`;
  const name = "Mock Google User";
  const email = `mock.user+${seed}@example.com`;
  const avatar = `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(
    name
  )}`;

  return { id, name, email, avatar };
}

export function MockAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(null);

  const loginWithMockGoogle = useCallback(() => {
    const nextUser = createMockUser();
    setUser(nextUser);
    return nextUser;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const value = useMemo<MockAuthContextValue>(() => {
    return {
      status: user ? "authenticated" : "unauthenticated",
      user,
      loginWithMockGoogle,
      logout,
    };
  }, [loginWithMockGoogle, logout, user]);

  return <MockAuthContext.Provider value={value}>{children}</MockAuthContext.Provider>;
}

export function useMockAuth(): MockAuthContextValue {
  const ctx = useContext(MockAuthContext);
  if (!ctx) {
    throw new Error("useMockAuth must be used within MockAuthProvider");
  }
  return ctx;
}

