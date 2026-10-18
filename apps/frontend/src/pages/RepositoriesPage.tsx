import { useMemo } from "react";
import { UnderstandingLoader } from "@/components/ui/understanding-loader";

import { PageHeader } from "@/components/PageHeader";
import { RequireAuth } from "@/features/auth/components/RequireAuth";
import { AvailableRepositoryList } from "@/features/repositories/components/AvailableRepositoryList";
import { RepositoryCard } from "@/features/repositories/components/RepositoryCard";
import { useAvailableRepositories } from "@/features/repositories/hooks/useAvailableRepositories";
import { useConnectedRepositories } from "@/features/repositories/hooks/useConnectedRepositories";
import { RepositoryUrlInput } from "@/features/repositories/components/RepositoryUrlInput";

export function RepositoriesPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
      <PageHeader
        title="Repositories"
        description="Choose a project for your interview story, file explanations, and interactive connection map."
      />

      <RepositoryUrlInput />

      <RequireAuth>
        <RepositoriesContent />
      </RequireAuth>
    </div>
  );
}

function RepositoriesContent() {
  const connected = useConnectedRepositories();
  const available = useAvailableRepositories();

  const connectedFullNames = useMemo(
    () => new Set((connected.data ?? []).map((repository) => repository.fullName)),
    [connected.data],
  );

  return (
    <>
      <section className="flex flex-col gap-4">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Connected</h2>

        {connected.status === "loading" ? <Loading label="Loading your repositories…" /> : null}

        {connected.status === "error" ? <p className="text-sm text-destructive">{connected.error}</p> : null}

        {connected.status === "success" && (connected.data?.length ?? 0) === 0 ? (
          <p className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
            No repositories connected yet. Pick one below to get started.
          </p>
        ) : null}

        {connected.data && connected.data.length > 0 ? (
          <div className="flex flex-wrap gap-4">
            {connected.data.map((repository) => (
              <RepositoryCard key={repository.id} repository={repository} />
            ))}
          </div>
        ) : null}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Available on GitHub</h2>

        {available.status === "loading" ? <Loading label="Loading GitHub repositories…" /> : null}

        {available.status === "error" ? <p className="text-sm text-destructive">{available.error}</p> : null}

        {available.data ? (
          <AvailableRepositoryList
            repositories={available.data}
            connectedFullNames={connectedFullNames}
            onConnected={connected.reload}
          />
        ) : null}
      </section>
    </>
  );
}

function Loading({ label }: { label: string }) {
  return <UnderstandingLoader compact label={label} />;
}
