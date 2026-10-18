import { useState, type ReactNode } from "react";
import { Link, Outlet, useLocation, useMatch, useSearchParams } from "react-router";

import { AppHeader } from "@/components/AppHeader";
import { APP_NAME } from "@/config/app";
import { useSession } from "@/features/auth/session-context";
import { syncRepository } from "@/features/repositories/api";
import { useRepository } from "@/features/repositories/hooks/useRepository";
import { RepositoryWorkspaceContext } from "@/features/repositories/repository-workspace-context";
import { clearAsyncResourceCache } from "@/hooks/useAsyncResource";
import { cn } from "@/lib/utils";

export function RootLayout() {
  const repository = useMatch("/repositories/:owner/:name");
  const home = useLocation().pathname === "/";
  const { status } = useSession();
  const [params] = useSearchParams();
  const focus =
    status === "authenticated" && Boolean(repository) && !["tour", "map", "explore"].includes(params.get("view") ?? "");
  const shell = (
    <div
      className={cn("flex flex-col bg-background text-foreground", focus ? "h-dvh overflow-hidden" : "min-h-screen")}
    >
      <AppHeader />
      <main
        className={cn(
          "w-full flex-1",
          focus
            ? "flex min-h-0 flex-col overflow-hidden px-2 pb-2 pt-20 sm:px-4"
            : home
              ? "px-4 sm:px-6 lg:px-8"
              : "px-4 pb-8 pt-24",
        )}
      >
        <Outlet />
      </main>
      {!focus ? (
        <footer className="border-t border-border/70">
          <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-8 px-4 py-10 sm:flex-row sm:items-end sm:justify-between sm:px-6 lg:px-8">
            <div>
              <Link
                to="/"
                className="text-sm font-semibold text-foreground hover:text-[#477842] dark:hover:text-[#c8f39a]"
              >
                {APP_NAME}
              </Link>
              <p className="mt-2 max-w-sm text-xs leading-relaxed text-muted-foreground">
                Understand unfamiliar GitHub repositories, one connection at a time.
              </p>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
              <Link to="/" className="hover:text-foreground">
                Home
              </Link>
              <Link to="/repositories" className="hover:text-foreground">
                Repositories
              </Link>
              <a href={home ? "#connect" : "/#connect"} className="hover:text-foreground">
                Connect GitHub
              </a>
            </div>
          </div>
        </footer>
      ) : null}
    </div>
  );

  if (repository && status === "authenticated") {
    const { owner = "", name = "" } = repository.params;
    return (
      <RepositoryWorkspaceProvider key={owner + "/" + name} owner={owner} name={name}>
        {shell}
      </RepositoryWorkspaceProvider>
    );
  }

  return shell;
}

function RepositoryWorkspaceProvider({ owner, name, children }: { owner: string; name: string; children: ReactNode }) {
  const repository = useRepository(owner, name);
  const [syncToken, setSyncToken] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  async function sync(): Promise<void> {
    if (syncing) return;
    setSyncing(true);
    setSyncError(null);

    try {
      await syncRepository(owner, name);
      clearAsyncResourceCache();
      setSyncToken((token) => token + 1);
    } catch (cause) {
      setSyncError(cause instanceof Error ? cause.message : "Could not sync the file tree");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <RepositoryWorkspaceContext.Provider value={{ repository, syncToken, syncing, syncError, sync }}>
      {children}
    </RepositoryWorkspaceContext.Provider>
  );
}
