import { createContext, useContext } from "react";

import type { SessionUser } from "@/features/auth/types";

export interface SessionContextValue {
  status: "loading" | "authenticated" | "anonymous";
  user: SessionUser | null;
  connectWithToken: (token: string) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const SessionContext = createContext<SessionContextValue | null>(null);

export function useSession(): SessionContextValue {
  const value = useContext(SessionContext);

  if (!value) {
    throw new Error("useSession must be used within a SessionProvider");
  }

  return value;
}
