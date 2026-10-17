import type { ReactNode } from "react";

import { SessionProvider } from "@/features/auth/SessionProvider";

/**
 * Central place for application-wide providers (session, theme, query client, ...).
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
