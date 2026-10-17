import { ArrowRight, Lock } from "lucide-react";
import { Link } from "react-router";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ConnectedRepository } from "@/features/repositories/types";

export function RepositoryCard({ repository }: { repository: ConnectedRepository }) {
  return (
    <Card className="transition-colors hover:border-foreground/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          {repository.isPrivate ? <Lock className="size-3.5 text-muted-foreground" /> : null}
          {repository.fullName}
        </CardTitle>
        <CardDescription className="line-clamp-2">{repository.description ?? "No description"}</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-4 text-sm">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {repository.language ? <span>{repository.language}</span> : null}
          <span>default: {repository.defaultBranch}</span>
        </div>
        <Link
          className="inline-flex items-center gap-1 text-sm font-medium hover:underline"
          to={`/repositories/${repository.owner}/${repository.name}`}
        >
          Explore
          <ArrowRight className="size-3.5" />
        </Link>
      </CardContent>
    </Card>
  );
}
