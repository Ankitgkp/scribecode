import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { connectWithPersonalAccessToken, fetchSession, logout as logoutRequest } from "@/features/auth/api";
import { SessionContext, type SessionContextValue } from "@/features/auth/session-context";
import type { SessionUser } from "@/features/auth/types";

/**
 * Loads the current session once and exposes helpers to connect or sign out.
 * Mounted at the app root so every screen and the header share one source of truth.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SessionContextValue["status"]>("loading");
  const [user, setUser] = useState<SessionUser | null>(null);

  const refresh = useCallback(async () => {
    try {
      const session = await fetchSession();
      setUser(session.user);
      setStatus(session.authenticated && session.user ? "authenticated" : "anonymous");
    } catch {
      setUser(null);
      setStatus("anonymous");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const connectWithToken = useCallback(async (token: string) => {
    const session = await connectWithPersonalAccessToken(token);
    setUser(session.user);
    setStatus(session.authenticated && session.user ? "authenticated" : "anonymous");
  }, []);

  const signOut = useCallback(async () => {
    await logoutRequest();
    setUser(null);
    setStatus("anonymous");
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({ status, user, connectWithToken, signOut, refresh }),
    [status, user, connectWithToken, signOut, refresh],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
