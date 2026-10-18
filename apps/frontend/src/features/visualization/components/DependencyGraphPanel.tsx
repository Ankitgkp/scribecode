import type { ReactNode } from "react";
import { useMemo } from "react";
import { Boxes, GitBranch } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DependencyLinkCard } from "@/features/visualization/components/DependencyLinkCard";
import { directory, fileName, hubs, neighborhood, type Hub } from "@/features/visualization/lib/graph";
import { cn } from "@/lib/utils";
import type { Graph, GraphNode } from "@/types/graph";

interface DependencyGraphPanelProps {
  graph: Graph | null;
  status: "loading" | "success" | "error";
  error: string | null;
  /** File currently selected in the tree, used to focus the view. */
  selectedPath: string;
  onSelectFile: (path: string) => void;
}

/**
 * Focused, one-hop view of the dependency graph: what the selected file imports
 * and what imports it. A whole-repository import graph is unreadable at this
 * scale, so files are shown as clickable cards that walk the chain instead.
 */
export function DependencyGraphPanel({ graph, status, error, selectedPath, onSelectFile }: DependencyGraphPanelProps) {
  const loading = status === "loading";

  return (
    <Card className="overflow-hidden rounded-[1.75rem] border-[#e7eae8] bg-[#f5f8f5] shadow-none dark:border-white/10 dark:bg-[#26332f]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <span className="grid size-9 place-items-center rounded-xl bg-[#d8ebe2] text-[#23634d] dark:bg-teal-900 dark:text-teal-200">
            <GitBranch className="size-4" />
          </span>
          File impact
        </CardTitle>
        <CardDescription>What this file uses, what relies on it, and where a change could ripple next.</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {error ? (
          <p className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        {loading && !graph ? <PanelMessage>Reading imports across the project…</PanelMessage> : null}

        {graph && graph.nodes.length === 0 ? (
          <PanelMessage>No importable source files were found in this repository.</PanelMessage>
        ) : null}

        {graph && graph.nodes.length > 0 ? (
          <FocusedView graph={graph} selectedPath={selectedPath} onSelectFile={onSelectFile} />
        ) : null}
      </CardContent>
    </Card>
  );
}

interface FocusedViewProps {
  graph: Graph;
  selectedPath: string;
  onSelectFile: (path: string) => void;
}

function FocusedView({ graph, selectedPath, onSelectFile }: FocusedViewProps) {
  const view = useMemo(() => neighborhood(graph, selectedPath), [graph, selectedPath]);
  const topHubs = useMemo(() => hubs(graph, 8), [graph]);

  if (selectedPath.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <PanelMessage>Select a file in the tree to see its impact on the project.</PanelMessage>
        <HubList hubs={topHubs} onSelectFile={onSelectFile} />
      </div>
    );
  }

  const linked = view.imports.length + view.importedBy.length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-sm font-semibold">{fileName(selectedPath)}</span>
        <code className="truncate text-xs text-muted-foreground">{selectedPath}</code>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <DependencyColumn
          title="Imports"
          tone="mint"
          nodes={view.imports}
          emptyLabel="Imports nothing from this repository."
          onSelectFile={onSelectFile}
        />
        <DependencyColumn
          title="Imported by"
          tone="pink"
          nodes={view.importedBy}
          emptyLabel="Nothing in this repository imports it."
          onSelectFile={onSelectFile}
        />
      </div>

      {view.packages.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Packages</span>
          {view.packages.map((dependency) => (
            <Badge key={dependency.id} variant="muted" title={dependency.id}>
              {dependency.label}
            </Badge>
          ))}
        </div>
      ) : null}

      {linked === 0 ? (
        <p className="text-xs text-muted-foreground">
          This file is not linked to other source files in the repository.
        </p>
      ) : null}

      <HubList hubs={topHubs} onSelectFile={onSelectFile} />
    </div>
  );
}

interface DependencyColumnProps {
  title: string;
  tone: "mint" | "pink";
  nodes: GraphNode[];
  emptyLabel: string;
  onSelectFile: (path: string) => void;
}

function DependencyColumn({ title, tone, nodes, emptyLabel, onSelectFile }: DependencyColumnProps) {
  return (
    <section
      className={cn(
        "flex flex-col gap-2 rounded-[1.4rem] p-4",
        tone === "mint" ? "bg-[#dceee7] dark:bg-teal-900/45" : "bg-[#f5e3e9] dark:bg-rose-900/35",
      )}
    >
      <header className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">{title}</h3>
        <Badge variant="muted">{nodes.length}</Badge>
      </header>

      {nodes.length === 0 ? (
        <p className="text-xs text-muted-foreground">{emptyLabel}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {nodes.map((node) => (
            <li key={node.id}>
              <DependencyLinkCard node={node} onSelect={onSelectFile} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

interface HubListProps {
  hubs: Hub[];
  onSelectFile: (path: string) => void;
}

/** Where the code converges — a compact stand-in for the whole-repo graph. */
function HubList({ hubs, onSelectFile }: HubListProps) {
  if (hubs.length === 0) {
    return null;
  }

  return (
    <details className="rounded-[1.3rem] bg-white px-4 py-3 dark:bg-white/5">
      <summary className="flex cursor-pointer items-center gap-2 text-sm font-medium">
        <Boxes className="size-4 text-muted-foreground" />
        Most connected files
        <span className="text-xs font-normal text-muted-foreground">where the code converges</span>
      </summary>

      <ul className="mt-2 flex flex-col gap-1">
        {hubs.map((hub) => (
          <li key={hub.node.id}>
            <button
              type="button"
              onClick={() => onSelectFile(hub.node.id)}
              className="flex w-full items-center gap-3 rounded-md px-2 py-1 text-left text-sm transition hover:bg-accent focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none"
            >
              <span className="min-w-0 flex-1 truncate">
                {hub.node.label}
                <span className="ml-2 text-xs text-muted-foreground">{directory(hub.node.id)}</span>
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {hub.incoming} in · {hub.outgoing} out
              </span>
            </button>
          </li>
        ))}
      </ul>
    </details>
  );
}

function PanelMessage({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-center gap-2 rounded-lg border border-dashed px-4 py-8 text-sm text-muted-foreground">
      {children}
    </p>
  );
}
