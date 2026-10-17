import type { ReactNode } from "react";

import { ConnectGitHubPanel } from "@/features/auth/components/ConnectGitHubPanel";
import { useSession } from "@/features/auth/session-context";

/**
 * Renders `children` only for authenticated users; otherwise prompts them to
 * connect GitHub.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useSession();

  if (status === "loading") {
    return <p className="text-sm text-muted-foreground">Checking your session…</p>;
  }

  if (status === "anonymous") {
    return <ConnectGitHubPanel />;
  }

  return <>{children}</>;
}
