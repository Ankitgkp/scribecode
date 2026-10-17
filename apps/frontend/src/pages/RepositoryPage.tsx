import { useState } from "react";
import { Link, useParams } from "react-router";
import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RequireAuth } from "@/features/auth/components/RequireAuth";
import { RepositoryExplorer } from "@/features/explorer/components/RepositoryExplorer";
import { syncRepository } from "@/features/repositories/api";
import { useRepository } from "@/features/repositories/hooks/useRepository";
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
  const repository = useRepository(owner, name);
  const [syncToken, setSyncToken] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  async function handleSync(): Promise<void> {
    setSyncing(true);
    setSyncError(null);

    try {
      await syncRepository(owner, name);
      setSyncToken((token) => token + 1);
    } catch (cause) {
      setSyncError(cause instanceof Error ? cause.message : "Could not sync the file tree");
    } finally {
      setSyncing(false);
    }
  }

  const notConnected = repository.status === "error";

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link to="/repositories" className="hover:text-foreground hover:underline">
              Repositories
            </Link>
            <span>/</span>
            <span>
              {owner}/{name}
            </span>
          </nav>
          <h1 className="text-xl font-semibold tracking-tight">{repository.data?.fullName ?? `${owner}/${name}`}</h1>
          {repository.data?.description ? (
            <p className="text-sm text-muted-foreground">{repository.data.description}</p>
          ) : null}
        </div>

        {!notConnected ? (
          <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
            <RefreshCw className={cn("size-3.5", syncing && "animate-spin")} />
            Sync file tree
          </Button>
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
