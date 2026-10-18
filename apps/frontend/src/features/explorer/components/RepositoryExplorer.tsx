import { Compass, FileCode2, GraduationCap, Waypoints } from "lucide-react";
import { useMemo } from "react";
import { useSearchParams } from "react-router";

import { FileAnalysisView } from "@/features/analysis/components/FileAnalysisView";
import { FileTreePanel } from "@/features/explorer/components/FileTreePanel";
import { useFileTree } from "@/features/explorer/hooks/useFileTree";
import { buildFileTree } from "@/features/explorer/lib/buildFileTree";
import { ProductMap } from "@/features/insights/components/ProductMap";
import { ProjectTour } from "@/features/insights/components/ProjectTour";
import { InterviewPreparation } from "@/features/insights/components/InterviewPreparation";
import { useRepositoryPreparation } from "@/features/insights/hooks/useRepositoryPreparation";
import { DependencyGraphPanel } from "@/features/visualization/components/DependencyGraphPanel";
import { cn } from "@/lib/utils";

type ExplorerView = "interview" | "tour" | "map" | "explore";

const VIEWS = [
  { id: "interview", label: "Quick interview preparation", icon: GraduationCap },
  { id: "tour", label: "Project tour", icon: Compass },
  { id: "map", label: "How it works", icon: Waypoints },
  { id: "explore", label: "Explore files", icon: FileCode2 },
] as const;

interface RepositoryExplorerProps {
  owner: string;
  name: string;
}

/**
 * The core exploration surface: a file tree on the left and a tabbed workspace
 * on the right (tour, product map, and file exploration).
 * The selected file and active tab live in the URL so views are shareable.
 */
export function RepositoryExplorer({ owner, name }: RepositoryExplorerProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedPath = searchParams.get("path") ?? "";
  const viewParam = searchParams.get("view");
  const view: ExplorerView =
    viewParam === "map" || viewParam === "explore" || viewParam === "tour" ? viewParam : "interview";

  // Repository-wide analysis begins immediately and is reused by every view.
  const preparation = useRepositoryPreparation(owner, name);
  const tree = useFileTree(owner, name, preparation.status !== "loading");

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
    <div
      className={cn(
        view === "interview"
          ? "flex min-h-0 flex-1 flex-col"
          : "grid gap-5 rounded-[2rem] border border-[#e7eae8] bg-[#f6f7f5] p-3 shadow-[0_24px_70px_-55px_rgba(15,27,25,.4)] sm:p-4 lg:grid-cols-[270px_minmax(0,1fr)] dark:border-white/10 dark:bg-[#1b2020]",
      )}
    >
      {view !== "interview" ? (
        <aside className="lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-auto">
          <FileTreePanel
            nodes={nodes}
            status={tree.status}
            error={tree.error}
            selectedPath={selectedPath}
            onSelect={(path) => updateParams({ path, view: view === "map" ? view : "explore" })}
          />
        </aside>
      ) : null}

      <section
        className={cn(
          "flex min-w-0 flex-col rounded-[1.6rem] bg-white dark:bg-[#202525]",
          view === "interview"
            ? "min-h-0 flex-1 gap-3 overflow-hidden border border-[#e7eae8] p-3 sm:p-4 dark:border-white/10"
            : "gap-5 p-4 sm:p-6",
        )}
      >
        <nav
          role="tablist"
          aria-label="Repository views"
          className="flex w-fit max-w-full shrink-0 gap-1 overflow-x-auto rounded-full bg-[#f0f1ef] p-1 dark:bg-white/10"
        >
          {VIEWS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={view === id}
              onClick={() => updateParams({ view: id })}
              className={cn(
                "inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 sm:px-4 sm:text-sm",
                view === id
                  ? id === "interview"
                    ? "bg-[#d8f596] text-[#25362b] shadow-sm"
                    : "bg-[#242b2b] text-white shadow-sm dark:bg-[#dafa9b] dark:text-[#1e2a24]"
                  : id === "interview"
                    ? "bg-[#e5f4ca] text-[#304e34] dark:bg-lime-900/30 dark:text-lime-200"
                    : "text-[#626b68] hover:bg-white hover:text-[#242b2b] dark:text-white/65 dark:hover:bg-white/10 dark:hover:text-white",
              )}
            >
              <Icon className="size-4" /> {label}
            </button>
          ))}
        </nav>

        {view === "interview" ? (
          <InterviewPreparation
            owner={owner}
            name={name}
            insights={preparation.data?.insights ?? null}
            graph={preparation.data?.graph ?? null}
            tree={tree.data ?? []}
            selectedPath={selectedPath}
            status={preparation.status}
            error={preparation.error}
            onSelectFile={(path) => updateParams({ path, view: "interview" })}
            onExploreFile={(path) => updateParams({ path, view: "explore" })}
          />
        ) : null}

        {view === "tour" ? (
          <ProjectTour
            insights={preparation.data?.insights ?? null}
            status={preparation.status}
            error={preparation.error}
            onSelectFile={(path) => updateParams({ path, view: "explore" })}
            onShowMap={() => updateParams({ view: "map" })}
          />
        ) : null}

        {view === "map" ? (
          <ProductMap
            owner={owner}
            name={name}
            filePaths={tree.data?.filter((entry) => entry.type === "blob").map((entry) => entry.path) ?? []}
            insights={preparation.data?.insights ?? null}
            graph={preparation.data?.graph ?? null}
            selectedPath={selectedPath}
            status={preparation.status}
            error={preparation.error}
            onSelectFile={(path) => updateParams({ path, view: "explore" })}
            onFocusFile={(path) => updateParams({ path, view: "map" })}
          />
        ) : null}

        {view === "explore" ? (
          <FileAnalysisView
            owner={owner}
            name={name}
            path={selectedPath}
            context={
              <DependencyGraphPanel
                graph={preparation.data?.graph ?? null}
                status={preparation.status}
                error={preparation.error}
                selectedPath={selectedPath}
                onSelectFile={(path) => updateParams({ path, view: "explore" })}
              />
            }
          />
        ) : null}
      </section>
    </div>
  );
}
