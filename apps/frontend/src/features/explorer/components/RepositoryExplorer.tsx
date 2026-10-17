import { useMemo } from "react";
import { useSearchParams } from "react-router";

import { Tabs } from "@/components/ui/tabs";
import { ArchitecturePanel } from "@/features/analysis/components/ArchitecturePanel";
import { FileAnalysisView } from "@/features/analysis/components/FileAnalysisView";
import { useArchitecture } from "@/features/analysis/hooks/useArchitecture";
import { FileTreePanel } from "@/features/explorer/components/FileTreePanel";
import { useFileTree } from "@/features/explorer/hooks/useFileTree";
import { buildFileTree } from "@/features/explorer/lib/buildFileTree";
import { DependencyGraphPanel } from "@/features/visualization/components/DependencyGraphPanel";
import { useDependencyGraph } from "@/features/visualization/hooks/useDependencyGraph";

type ExplorerView = "code" | "dependencies" | "architecture";

const VIEWS = [
  { id: "code", label: "Explain" },
  { id: "dependencies", label: "Dependencies" },
  { id: "architecture", label: "Architecture" },
] as const;

interface RepositoryExplorerProps {
  owner: string;
  name: string;
}

/**
 * The core exploration surface: a file tree on the left and a tabbed workspace
 * on the right (annotated walkthrough, dependency view, architecture map).
 * The selected file and active tab live in the URL so views are shareable.
 */
export function RepositoryExplorer({ owner, name }: RepositoryExplorerProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedPath = searchParams.get("path") ?? "";
  const viewParam = searchParams.get("view");
  const view: ExplorerView = viewParam === "dependencies" || viewParam === "architecture" ? viewParam : "code";

  const tree = useFileTree(owner, name);
  // Both heavy panels are loaded up front (and memoized) so switching tabs is
  // instant and never re-runs the graph build or the model.
  const dependencies = useDependencyGraph(owner, name);
  const architecture = useArchitecture(owner, name);

  const nodes = useMemo(() => (tree.data ? buildFileTree(tree.data) : []), [tree.data]);

  function updateParams(next: { path?: string; view?: ExplorerView }): void {
    const params = new URLSearchParams(searchParams);

    if (next.path !== undefined) {
      if (next.path.length === 0) {
        params.delete("path");
      } else {
        params.set("path", next.path);
      }
    }

    if (next.view !== undefined) {
      params.set("view", next.view);
    }

    setSearchParams(params, { replace: true });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-auto">
        <FileTreePanel
          nodes={nodes}
          status={tree.status}
          error={tree.error}
          selectedPath={selectedPath}
          onSelect={(path) => updateParams({ path })}
        />
      </aside>

      <section className="flex min-w-0 flex-col gap-4">
        <Tabs items={VIEWS} value={view} onChange={(next) => updateParams({ view: next })} />

        {view === "code" ? <FileAnalysisView owner={owner} name={name} path={selectedPath} /> : null}

        {view === "dependencies" ? (
          <DependencyGraphPanel
            graph={dependencies.data}
            status={dependencies.status}
            error={dependencies.error}
            selectedPath={selectedPath}
            onSelectFile={(path) => updateParams({ path })}
            onRefresh={dependencies.rebuild}
          />
        ) : null}

        {view === "architecture" ? (
          <ArchitecturePanel
            analysis={architecture.data}
            status={architecture.status}
            error={architecture.error}
            onRegenerate={architecture.regenerate}
          />
        ) : null}
      </section>
    </div>
  );
}
