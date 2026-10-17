import type { ReactNode } from "react";
import { useMemo } from "react";
import { Boxes, Loader2, RefreshCw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { groupArchitecture, prettyGroupName, type ArchitectureGroup } from "@/features/analysis/lib/architecture";
import type { ArchitectureAnalysis } from "@/features/analysis/types";
import { cn } from "@/lib/utils";

interface ArchitecturePanelProps {
  analysis: ArchitectureAnalysis | null;
  status: "loading" | "success" | "error";
  error: string | null;
  onRegenerate: () => void;
}

/**
 * Renders the AI architecture map as grouped module cards rather than a
 * node/edge canvas: every module gets a section, and its relationships are
 * listed as short "points at" chips, which stays readable at any size.
 */
export function ArchitecturePanel({ analysis, status, error, onRegenerate }: ArchitecturePanelProps) {
  const loading = status === "loading";
  const groups = useMemo(() => (analysis ? groupArchitecture(analysis.graph) : []), [analysis]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{analysis?.title ?? "Architecture"}</CardTitle>
        <CardDescription>How the repository is organised, grouped into modules.</CardDescription>
        <CardAction>
          <Button variant="outline" size="sm" onClick={onRegenerate} disabled={loading}>
            <RefreshCw className={cn(loading && "animate-spin")} />
            Regenerate
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {error ? (
          <p className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        {loading && !analysis ? (
          <p className="flex items-center gap-2 rounded-lg border border-dashed px-4 py-8 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Mapping modules and their relationships…
          </p>
        ) : null}

        {analysis ? <ArchitectureBody groupCount={groups.length} analysis={analysis} groups={groups} /> : null}
      </CardContent>
    </Card>
  );
}

interface ArchitectureBodyProps {
  analysis: ArchitectureAnalysis;
  groups: ArchitectureGroup[];
  groupCount: number;
}

function ArchitectureBody({ analysis, groups, groupCount }: ArchitectureBodyProps) {
  const { edges } = analysis.graph;

  return (
    <>
      {analysis.overview ? <p className="max-w-3xl text-sm text-muted-foreground">{analysis.overview}</p> : null}

      {groups.length === 0 ? (
        <PanelMessage>No modules were identified for this repository.</PanelMessage>
      ) : (
        <>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Boxes className="size-3.5" />
            {groupCount} module{groupCount === 1 ? "" : "s"} · {edges.length} connection
            {edges.length === 1 ? "" : "s"}
          </p>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {groups.map((group) => (
              <ModuleCard key={group.name} group={group} />
            ))}
          </div>
        </>
      )}
    </>
  );
}

function ModuleCard({ group }: { group: ArchitectureGroup }) {
  return (
    <section className="flex flex-col gap-2 rounded-lg border bg-muted/20 p-3">
      <header className="flex items-center justify-between gap-2">
        <h3 className="truncate text-sm font-semibold" title={group.name}>
          {prettyGroupName(group.name)}
        </h3>
        <Badge variant="muted">{group.nodes.length}</Badge>
      </header>

      <ul className="flex flex-col gap-2">
        {group.nodes.map((item) => (
          <li key={item.node.id} className="rounded-md border bg-background p-2">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium">{item.node.label}</p>
              {item.incomingCount > 0 ? (
                <span className="shrink-0 text-[10px] text-muted-foreground">{item.incomingCount} in</span>
              ) : null}
            </div>

            {item.node.description ? (
              <p className="mt-0.5 text-xs text-muted-foreground">{item.node.description}</p>
            ) : null}

            {item.links.length > 0 ? (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {item.links.map((link) => (
                  <Badge key={link.id} variant="outline" className="text-[10px] font-normal">
                    → {link.label}
                  </Badge>
                ))}
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

function PanelMessage({ children }: { children: ReactNode }) {
  return <p className="rounded-lg border border-dashed px-4 py-8 text-sm text-muted-foreground">{children}</p>;
}
