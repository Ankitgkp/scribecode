import { useMemo, useState } from "react";
import { Check, Loader2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { connectRepository } from "@/features/repositories/api";
import type { GitHubRepositorySummary } from "@/features/repositories/types";

interface AvailableRepositoryListProps {
  repositories: GitHubRepositorySummary[];
  connectedFullNames: ReadonlySet<string>;
  onConnected: () => void;
}

export function AvailableRepositoryList({
  repositories,
  connectedFullNames,
  onConnected,
}: AvailableRepositoryListProps) {
  const [filter, setFilter] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const query = filter.trim().toLowerCase();
    if (query.length === 0) {
      return repositories;
    }
    return repositories.filter((repository) => repository.fullName.toLowerCase().includes(query));
  }, [repositories, filter]);

  async function handleConnect(repository: GitHubRepositorySummary): Promise<void> {
    setPendingId(repository.id);
    setError(null);

    try {
      await connectRepository({ owner: repository.owner, name: repository.name });
      onConnected();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not connect the repository");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Input
        placeholder="Filter by name…"
        value={filter}
        onChange={(event) => setFilter(event.target.value)}
        aria-label="Filter repositories"
      />

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {filtered.length === 0 ? (
        <p className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
          No repositories matched.
        </p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {filtered.map((repository) => {
            const isConnected = connectedFullNames.has(repository.fullName);

            return (
              <li key={repository.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{repository.fullName}</p>
                  <p className="truncate text-xs text-muted-foreground">{repository.description ?? "No description"}</p>
                </div>
                <Button
                  size="sm"
                  variant={isConnected ? "outline" : "default"}
                  disabled={isConnected || pendingId === repository.id}
                  onClick={() => void handleConnect(repository)}
                >
                  {pendingId === repository.id ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : isConnected ? (
                    <Check className="size-3.5" />
                  ) : (
                    <Plus className="size-3.5" />
                  )}
                  {isConnected ? "Connected" : "Connect"}
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
