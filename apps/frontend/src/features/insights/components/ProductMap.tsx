import { ArrowRight, Boxes, Database, GitBranch, Layers3, Puzzle, Sparkles, Waypoints } from "lucide-react";
import { useMemo, useState } from "react";

import { FileConnectionsMap } from "@/features/insights/components/FileConnectionsMap";
import { UnderstandingLoader } from "@/components/ui/understanding-loader";
import type { InsightModule, ModuleKind, ProjectInsights } from "@/features/insights/types";
import { cn } from "@/lib/utils";
import type { Graph } from "@/types/graph";

const ICONS: Record<ModuleKind, typeof Boxes> = {
  interface: Layers3,
  feature: Puzzle,
  logic: GitBranch,
  data: Database,
  integration: Waypoints,
  configuration: Boxes,
};

const TONES = [
  "bg-[#d9eee9] dark:bg-teal-900/55",
  "bg-[#f7dce9] dark:bg-rose-900/55",
  "bg-[#e2daf4] dark:bg-violet-900/55",
  "bg-[#ffecb7] dark:bg-amber-900/55",
  "bg-[#dbeafb] dark:bg-sky-900/55",
  "bg-[#e5edce] dark:bg-lime-900/55",
] as const;

interface ProductMapProps {
  owner?: string;
  name?: string;
  filePaths?: string[];
  onFocusFile?: (path: string) => void;
  insights: ProjectInsights | null;
  graph?: Graph | null;
  selectedPath?: string;
  status: "loading" | "success" | "error";
  error: string | null;
  onSelectFile: (path: string) => void;
}

export function ProductMap({
  owner,
  name,
  filePaths,
  onFocusFile,
  insights,
  graph,
  selectedPath = "",
  status,
  error,
  onSelectFile,
}: ProductMapProps) {
  const [mode, setMode] = useState<"files" | "features">("files");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = useMemo(
    () => insights?.modules.find((module) => module.id === selectedId) ?? insights?.modules[0] ?? null,
    [insights, selectedId],
  );
  const modulesById = useMemo(() => new Map(insights?.modules.map((module) => [module.id, module]) ?? []), [insights]);

  if (status === "loading" && !insights) {
    return <UnderstandingLoader label="Mapping your project…" />;
  }
  if (error && !insights)
    return (
      <p role="alert" className="rounded-3xl bg-red-50 p-6 text-sm text-destructive">
        {error}
      </p>
    );
  if (!insights) return null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-[.14em] text-teal-700 uppercase dark:text-teal-300">
            <Sparkles className="size-4" /> Explore the system
          </span>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">How this project works</h2>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Follow real file imports, or step back to see the feature areas.
          </p>
        </div>
        <div
          role="tablist"
          aria-label="Map view"
          className="inline-flex w-fit rounded-full bg-[#e9eae8] p-1 dark:bg-white/10"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === "files"}
            onClick={() => setMode("files")}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition",
              mode === "files" ? "bg-[#252a2a] text-white shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            File connections
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "features"}
            onClick={() => setMode("features")}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition",
              mode === "features" ? "bg-[#252a2a] text-white shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            Feature areas
          </button>
        </div>
      </div>

      {mode === "files" ? (
        <FileConnectionsMap
          owner={owner}
          name={name}
          filePaths={filePaths}
          insights={insights}
          onFocusFile={onFocusFile}
          graph={graph ?? { nodes: [], edges: [] }}
          selectedPath={selectedPath}
          onSelectFile={onSelectFile}
        />
      ) : (
        <FeatureAreas
          modules={insights.modules}
          selected={selected}
          modulesById={modulesById}
          onSelect={setSelectedId}
          onSelectFile={onSelectFile}
        />
      )}

      {insights.flows.length > 0 ? <FlowStories flows={insights.flows} /> : null}
    </div>
  );
}

function FeatureAreas({
  modules,
  selected,
  modulesById,
  onSelect,
  onSelectFile,
}: {
  modules: InsightModule[];
  selected: InsightModule | null;
  modulesById: Map<string, InsightModule>;
  onSelect: (id: string) => void;
  onSelectFile: (path: string) => void;
}) {
  if (!modules.length)
    return (
      <div className="rounded-3xl bg-[#e9f3ef] p-8 text-sm text-muted-foreground">
        No feature areas were identified yet.
      </div>
    );

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.85fr)]">
      <div className="grid gap-3 sm:grid-cols-2">
        {modules.map((module, index) => {
          const Icon = ICONS[module.kind];
          return (
            <button
              key={module.id}
              type="button"
              aria-label={`Show ${module.name} details`}
              aria-pressed={module.id === selected?.id}
              onClick={() => onSelect(module.id)}
              className={cn(
                "group relative flex min-h-44 flex-col justify-between overflow-hidden rounded-[1.65rem] p-5 text-left text-[#20252b] transition duration-200 hover:-translate-y-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 dark:text-white",
                TONES[index % TONES.length],
                module.id === selected?.id && "ring-2 ring-[#28302e] ring-offset-2 dark:ring-white",
              )}
            >
              <span className="absolute -right-9 -top-9 size-32 rounded-full border-[18px] border-white/30 transition-transform group-hover:scale-125" />
              <span className="relative flex items-start justify-between">
                <span className="grid size-11 place-items-center rounded-full bg-white/70 shadow-sm dark:bg-black/20">
                  <Icon className="size-5" />
                </span>
                <span className="grid size-9 place-items-center rounded-full bg-white/70 transition group-hover:rotate-45 dark:bg-black/20">
                  <ArrowRight className="size-4 -rotate-45" />
                </span>
              </span>
              <span className="relative">
                <strong className="block text-lg leading-tight">{module.name}</strong>
                <span className="mt-1 block line-clamp-2 text-sm leading-snug opacity-75">{module.purpose}</span>
              </span>
            </button>
          );
        })}
      </div>

      {selected ? (
        <aside className="flex flex-col justify-between rounded-[1.75rem] bg-[#242b2c] p-6 text-white shadow-[0_20px_38px_-28px_rgba(0,0,0,.6)]">
          <div>
            <p className="text-xs font-semibold tracking-[.16em] text-[#c0e5d7] uppercase">Selected area</p>
            <h3 className="mt-3 text-2xl font-semibold leading-tight">{selected.name}</h3>
            <p className="mt-3 text-sm leading-relaxed text-white/70">{selected.purpose}</p>
            <div className="mt-6 border-t border-white/15 pt-5">
              <p className="text-xs font-semibold tracking-[.14em] text-white/55 uppercase">Connects with</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {selected.connectsTo.length ? (
                  selected.connectsTo.map((id) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => onSelect(id)}
                      className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/20"
                    >
                      {modulesById.get(id)?.name ?? id} ↗
                    </button>
                  ))
                ) : (
                  <span className="text-sm text-white/55">No mapped feature links</span>
                )}
              </div>
            </div>
          </div>
          <div className="mt-6 border-t border-white/15 pt-5">
            <p className="mb-3 text-xs font-semibold tracking-[.14em] text-white/55 uppercase">Files to explore</p>
            <div className="flex flex-col gap-2">
              {selected.paths.length ? (
                selected.paths.map((path) => (
                  <button
                    key={path}
                    type="button"
                    onClick={() => onSelectFile(path)}
                    className="flex items-center justify-between gap-3 rounded-xl bg-white/10 px-3 py-2 text-left text-xs hover:bg-white/20"
                  >
                    <code className="truncate">{path}</code>
                    <ArrowRight className="size-3.5 shrink-0" />
                  </button>
                ))
              ) : (
                <span className="text-sm text-white/55">No files mapped to this area</span>
              )}
            </div>
          </div>
        </aside>
      ) : null}
    </div>
  );
}

function FlowStories({ flows }: { flows: ProjectInsights["flows"] }) {
  return (
    <section className="rounded-[1.8rem] bg-[#f0f1ee] p-5 sm:p-7 dark:bg-white/5">
      <div className="mb-5 flex items-center gap-2">
        <Waypoints className="size-5" />
        <h3 className="text-lg font-semibold">Follow a user journey</h3>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {flows.map((flow, index) => (
          <article
            key={flow.id}
            className={cn(
              "rounded-[1.4rem] p-5",
              index % 2 ? "bg-[#e0d7ee] dark:bg-violet-900/50" : "bg-[#d8e9e4] dark:bg-teal-900/50",
            )}
          >
            <h4 className="font-semibold">{flow.name}</h4>
            <p className="mt-1 text-sm text-muted-foreground">{flow.description}</p>
            <ol className="mt-5 flex flex-wrap gap-2">
              {flow.steps.map((step, stepIndex) => (
                <li key={`${flow.id}-${stepIndex}`} className="flex items-center gap-2">
                  <span className="rounded-full bg-white/80 px-3 py-1.5 text-xs font-medium dark:bg-black/20">
                    {stepIndex + 1}. {step}
                  </span>
                  {stepIndex < flow.steps.length - 1 ? <ArrowRight className="size-3.5 opacity-55" /> : null}
                </li>
              ))}
            </ol>
          </article>
        ))}
      </div>
    </section>
  );
}
