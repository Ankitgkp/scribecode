import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import { ArrowLeft, FolderGit2, RefreshCw, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RequireAuth } from "@/features/auth/components/RequireAuth";
import { RepositoryExplorer } from "@/features/explorer/components/RepositoryExplorer";
import { syncRepository } from "@/features/repositories/api";
import { useRepository } from "@/features/repositories/hooks/useRepository";
import { clearAsyncResourceCache } from "@/hooks/useAsyncResource";
import { cn } from "@/lib/utils";

export function RepositoryPage() {
  const { owner = "", name = "" } = useParams();

  return (
    <RequireAuth>
      <RepositoryView owner={owner} name={name} />
    </RequireAuth>
  );
}

function RepositoryView({ owner, name }: { owner: string; name: string }) {
  const [params] = useSearchParams();
  const focus = !["tour", "map", "explore"].includes(params.get("view") ?? "");
  const repository = useRepository(owner, name);
  const [syncToken, setSyncToken] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  async function handleSync(): Promise<void> {
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

  const notConnected = repository.status === "error";

  return (
    <div className={cn("mx-auto flex w-full max-w-[1660px] flex-col", focus ? "h-full min-h-0 gap-2" : "gap-5")}>
      <div
        className={cn(
          "flex shrink-0 items-center justify-between gap-4",
          focus ? "min-h-11 px-1" : "flex-wrap rounded-[1.8rem] bg-[#eff4f0] px-5 py-5 sm:px-7 dark:bg-[#203029]",
        )}
      >
        <div className="flex min-w-0 items-center gap-4">
          <Link
            to="/repositories"
            aria-label="Back to repositories"
            className={cn(
              "grid shrink-0 place-items-center rounded-full bg-white text-[#23312b] transition hover:-translate-x-0.5 dark:bg-white/10 dark:text-white",
              focus ? "size-8 border" : "size-11 shadow-sm",
            )}
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div className="min-w-0">
            <span
              className={cn(
                "items-center gap-1.5 text-xs font-semibold tracking-[.12em] text-teal-800 uppercase dark:text-teal-200",
                focus ? "hidden" : "inline-flex",
              )}
            >
              <Sparkles className="size-3.5" /> Project workspace
            </span>
            <h1
              className={cn(
                "flex min-w-0 items-center gap-2 font-semibold tracking-tight",
                focus ? "text-sm sm:text-base" : "mt-1 text-2xl sm:text-3xl",
              )}
            >
              <FolderGit2 className="size-5 shrink-0 opacity-60" />
              <span className="truncate">{repository.data?.fullName ?? `${owner}/${name}`}</span>
            </h1>
            {repository.data?.description && !focus ? (
              <p className="mt-1 max-w-2xl truncate text-sm text-[#61716a] dark:text-white/60">
                {repository.data.description}
              </p>
            ) : null}
          </div>
        </div>

        {!notConnected ? (
          <button
            type="button"
            onClick={handleSync}
            disabled={syncing}
            className={cn(
              "inline-flex shrink-0 items-center gap-2 rounded-full bg-[#252e2a] font-semibold text-white transition hover:bg-[#35463d] disabled:opacity-60 dark:bg-[#dcfa96] dark:text-[#1f2a20]",
              focus ? "px-3 py-2 text-xs" : "px-5 py-3 text-sm",
            )}
          >
            <RefreshCw className={cn("size-4", syncing && "animate-spin")} />
            {syncing ? "Refreshing understanding…" : "Sync project"}
          </button>
        ) : null}
      </div>

      {syncError ? <p className="text-sm text-destructive">{syncError}</p> : null}

      {notConnected ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Repository not connected</CardTitle>
            <CardDescription>{repository.error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to="/repositories">Back to repositories</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <RepositoryExplorer key={syncToken} owner={owner} name={name} />
      )}
    </div>
  );
}
