import type { ReactNode } from "react";

import { SessionProvider } from "@/features/auth/SessionProvider";
import { ThemeProvider } from "@/app/theme-context";

/**
 * Central place for application-wide providers (session, theme, query client, ...).
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <SessionProvider>{children}</SessionProvider>
    </ThemeProvider>
  );
}
