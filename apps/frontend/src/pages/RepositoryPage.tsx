import { Link, useParams, useSearchParams } from "react-router";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RepositoryUrlInput } from "@/features/repositories/components/RepositoryUrlInput";
import { RepositoryExplorer } from "@/features/explorer/components/RepositoryExplorer";
import { useRepositoryWorkspace } from "@/features/repositories/repository-workspace-context";
import { cn } from "@/lib/utils";

export function RepositoryPage() {
  const { owner = "", name = "" } = useParams();

  return <RepositoryView owner={owner} name={name} />;
}

function RepositoryView({ owner, name }: { owner: string; name: string }) {
  const [params] = useSearchParams();
  const focus = !["tour", "map", "explore"].includes(params.get("view") ?? "");
  const workspace = useRepositoryWorkspace();
  if (!workspace) throw new Error("Repository workspace is unavailable");
  const { repository, syncToken, syncError } = workspace;

  return (
    <div className={cn("mx-auto flex w-full max-w-[1660px] flex-col gap-3", focus && "h-full min-h-0")}>
      {syncError ? (
        <p role="alert" className="text-sm text-destructive">
          {syncError}
        </p>
      ) : null}

      {repository.status === "error" ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Repository unavailable</CardTitle>
            <CardDescription>{repository.error}</CardDescription>
          </CardHeader>
          <CardContent>
            <RepositoryUrlInput />
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
