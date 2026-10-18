import { ArrowRight, ArrowUpRight, FileCode2, GitBranch, Package, Search, Upload } from "lucide-react";
import { useMemo, useState, type DragEvent } from "react";

import { UnderstandingLoader } from "@/components/ui/understanding-loader";
import { useFileAnalysis } from "@/features/analysis/hooks/useFileAnalysis";
import { isReadableFile, REPOSITORY_FILE_DRAG_TYPE } from "@/features/insights/lib/interview-story";
import type { ProjectInsights } from "@/features/insights/types";
import { fileName, hubs, isExternalNode, neighborhood } from "@/features/visualization/lib/graph";
import { cn } from "@/lib/utils";
import type { Graph, GraphNode } from "@/types/graph";

interface FileConnectionsMapProps {
  graph: Graph;
  selectedPath: string;
  owner?: string;
  name?: string;
  filePaths?: string[];
  insights?: ProjectInsights;
  onSelectFile: (path: string) => void;
  onFocusFile?: (path: string) => void;
}
const MAX_VISIBLE = 3;

export function FileConnectionsMap({
  graph,
  selectedPath,
  owner,
  name,
  filePaths = [],
  insights,
  onSelectFile,
  onFocusFile,
}: FileConnectionsMapProps) {
  const [localFocus, setLocalFocus] = useState<{ path: string; selection: string } | null>(null);
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [dropError, setDropError] = useState<string | null>(null);
  const files = useMemo(() => {
    const nodes = new Map(graph.nodes.filter((node) => !isExternalNode(node)).map((node) => [node.id, node]));
    for (const path of [...filePaths, ...(selectedPath ? [selectedPath] : [])])
      if (!nodes.has(path)) nodes.set(path, { id: path, label: fileName(path) });
    return [...nodes.values()];
  }, [graph, filePaths, selectedPath]);
  const suggestedPath = hubs(graph, 1)[0]?.node.id ?? files[0]?.id ?? "";
  const activePath = localFocus?.selection === selectedPath ? localFocus.path : selectedPath || suggestedPath;
  const relations = useMemo(() => neighborhood(graph, activePath), [graph, activePath]);
  const readable = isReadableFile(activePath);
  const analysis = useFileAnalysis(owner ?? "", name ?? "", owner && name && readable ? activePath : "");
  const incoming = relations.importedBy.slice(0, MAX_VISIBLE);
  const allOutgoing = [...relations.imports, ...relations.packages];
  const outgoing = allOutgoing.slice(0, MAX_VISIBLE);
  const searchResults = query.trim()
    ? files.filter((node) => node.id.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 6)
    : [];
  const module = insights?.modules.find((area) => area.paths.includes(activePath));

  function focus(path: string): void {
    setLocalFocus({ path, selection: selectedPath });
    onFocusFile?.(path);
    setQuery("");
    setShowAll(false);
    setDropError(null);
  }
  function drop(event: DragEvent): void {
    event.preventDefault();
    setDragging(false);
    const path = event.dataTransfer.getData(REPOSITORY_FILE_DRAG_TYPE);
    if (path && files.some((node) => node.id === path)) focus(path);
    else setDropError("Drag a file from this repository’s file tree onto the map.");
  }

  return (
    <section
      aria-label="File connections map"
      onDragOver={(event) => {
        if (event.dataTransfer.types.includes(REPOSITORY_FILE_DRAG_TYPE)) {
          event.preventDefault();
          event.dataTransfer.dropEffect = "copy";
          setDragging(true);
        }
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false);
      }}
      onDrop={drop}
      className={cn(
        "relative overflow-hidden rounded-[1.8rem] border bg-white shadow-[0_20px_50px_-38px_rgba(28,37,57,.35)] dark:bg-[#22252b]",
        dragging ? "border-teal-500 ring-4 ring-teal-400/25" : "border-[#e1e4e5] dark:border-white/10",
      )}
    >
      {dragging ? (
        <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center rounded-3xl bg-teal-100/90 backdrop-blur-sm dark:bg-teal-950/90">
          <span className="flex items-center gap-3 rounded-3xl bg-white p-6 text-lg font-semibold text-teal-800 shadow-xl">
            <Upload className="size-6" /> Drop to follow this file’s connections
          </span>
        </div>
      ) : null}
      <header className="flex flex-col gap-4 border-b px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold tracking-[.13em] text-teal-700 uppercase dark:text-teal-300">
            <GitBranch className="size-4" /> Follow the connections
          </p>
          <h3 className="mt-1 text-xl font-semibold tracking-tight">One file. The whole context.</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Select a file in the tree, search below, or drag it onto this map.
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            aria-label="Find a file in the connection map"
            placeholder="Find a file…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="h-10 w-full rounded-full border bg-[#f7f8f8] pr-4 pl-10 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15 dark:bg-white/5"
          />
          {query.trim() ? (
            <div className="absolute top-12 right-0 left-0 z-20 max-h-60 overflow-auto rounded-2xl border bg-card p-1 shadow-xl">
              {searchResults.length ? (
                searchResults.map((node) => (
                  <button
                    key={node.id}
                    type="button"
                    onClick={() => focus(node.id)}
                    className="w-full rounded-xl px-3 py-2 text-left hover:bg-muted"
                  >
                    <strong className="block text-sm">{node.label}</strong>
                    <span className="block truncate text-xs text-muted-foreground">{node.id}</span>
                  </button>
                ))
              ) : (
                <p className="p-3 text-sm text-muted-foreground">No matching files.</p>
              )}
            </div>
          ) : null}
        </div>
      </header>
      {dropError ? (
        <p role="alert" className="px-6 pt-4 text-sm text-destructive">
          {dropError}
        </p>
      ) : null}
      {!activePath ? (
        <div className="p-10 text-center text-sm text-muted-foreground">
          No files are available yet. Sync your project to begin.
        </div>
      ) : (
        <>
          <div className="border-b bg-[#eef6f2] px-6 py-6 dark:bg-teal-950/20">
            <p className="text-xs font-semibold tracking-widest text-teal-700 uppercase dark:text-teal-300">
              The 20-second explanation · {fileName(activePath)}
            </p>
            {owner && name && readable && analysis.status === "loading" ? (
              <div className="mt-4">
                <UnderstandingLoader compact label="Finding this file’s purpose…" />
              </div>
            ) : null}
            {analysis.data ? (
              <>
                <p className="mt-3 max-w-4xl text-xl leading-relaxed font-medium tracking-tight sm:text-2xl">
                  {analysis.data.purpose}
                </p>
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                  {analysis.data.highlights.map((highlight) => (
                    <span key={highlight}>✦ {highlight}</span>
                  ))}
                </div>
              </>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                {module?.purpose ?? "Follow the direct imports below to see this file’s role in the project."}
              </p>
            )}
            {analysis.error ? (
              <div className="mt-3 text-sm">
                <p role="alert" className="text-destructive">
                  {analysis.error}
                </p>
                <button type="button" onClick={analysis.reload} className="mt-2 underline">
                  Retry explanation
                </button>
              </div>
            ) : null}
          </div>
          <div className="relative bg-[radial-gradient(circle_at_50%_44%,#e8f3f4,transparent_40%),#fbfbfa] p-5 sm:p-7 dark:bg-[radial-gradient(circle_at_50%_44%,#1d4041,transparent_40%),#1c2025]">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-25 [background-image:radial-gradient(#a6aab0_1px,transparent_1px)] [background-size:21px_21px]"
            />
            <p className="relative mb-5 text-xs text-muted-foreground">
              Read left → right. Pink files import this file. Yellow cards are its local imports; purple cards are
              packages. Click a file to keep following the story.
            </p>
            <div className="relative grid gap-5 xl:min-h-[420px] xl:grid-cols-[minmax(0,1fr)_minmax(210px,1.08fr)_minmax(0,1fr)] xl:items-center xl:gap-8">
              <ConnectionLines incoming={incoming.length} outgoing={outgoing.length} />
              <ConnectionColumn
                title="Used by"
                caption="These files import the focused file"
                nodes={incoming}
                total={relations.importedBy.length}
                direction="incoming"
                focusPath={activePath}
                insights={insights}
                onFocus={focus}
              />
              <div className="relative z-10 order-first xl:order-none">
                <div className="rounded-[1.8rem] bg-[#26352f] p-5 text-white shadow-[0_22px_50px_-20px_rgba(22,39,45,.6)]">
                  <span className="grid size-11 place-items-center rounded-2xl bg-[#c9f4e7] text-[#143c37]">
                    <FileCode2 className="size-5" />
                  </span>
                  <p className="mt-5 text-xs font-semibold tracking-[.15em] text-[#b5decf] uppercase">You are here</p>
                  <h4 className="mt-2 break-words text-xl font-semibold">{fileName(activePath)}</h4>
                  <code className="mt-2 block break-all text-xs text-white/60">{activePath}</code>
                  <p className="mt-4 text-sm leading-relaxed text-white/80">
                    {module ? `Part of ${module.name}.` : "Follow the arrows to see its direct dependencies."}
                  </p>
                  <button
                    type="button"
                    onClick={() => onSelectFile(activePath)}
                    className="mt-5 flex w-full items-center justify-between gap-2 rounded-full bg-[#d8fa90] px-4 py-3 text-sm font-semibold text-[#202823]"
                  >
                    Explain this file <ArrowUpRight className="size-4" />
                  </button>
                </div>
              </div>
              <ConnectionColumn
                title="Uses"
                caption="This file imports these pieces"
                nodes={outgoing}
                total={allOutgoing.length}
                direction="outgoing"
                focusPath={activePath}
                insights={insights}
                onFocus={focus}
              />
            </div>
            {relations.importedBy.length > MAX_VISIBLE || allOutgoing.length > MAX_VISIBLE ? (
              <div className="relative mt-5">
                <button
                  type="button"
                  aria-expanded={showAll}
                  onClick={() => setShowAll(!showAll)}
                  className="rounded-full bg-white px-4 py-2 text-sm font-medium shadow-sm dark:bg-slate-800"
                >
                  {showAll
                    ? "Hide extra connections"
                    : `Show all ${relations.importedBy.length + allOutgoing.length} connections`}
                </button>
                {showAll ? (
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <ExtraConnections title="All incoming connections" nodes={relations.importedBy} onFocus={focus} />
                    <ExtraConnections title="All outgoing connections" nodes={allOutgoing} onFocus={focus} />
                  </div>
                ) : null}
              </div>
            ) : null}
            <p className="relative mt-5 border-t pt-4 text-xs leading-relaxed text-muted-foreground">
              Connections come from parsed JavaScript/TypeScript imports; arrows show dependency direction, not runtime
              call order. Files outside the parsed portion or dynamic imports may have missing connections.
            </p>
          </div>
        </>
      )}
    </section>
  );
}

function ConnectionColumn({
  title,
  caption,
  nodes,
  total,
  direction,
  focusPath,
  insights,
  onFocus,
}: {
  title: string;
  caption: string;
  nodes: GraphNode[];
  total: number;
  direction: "incoming" | "outgoing";
  focusPath: string;
  insights?: ProjectInsights;
  onFocus: (path: string) => void;
}) {
  return (
    <section className="relative z-10 min-w-0">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h4 className="text-sm font-bold">{title}</h4>
          <p className="mt-1 text-xs text-muted-foreground">{caption}</p>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold shadow-sm dark:bg-white/10">
          {total}
        </span>
      </div>
      <div className="flex flex-col gap-3">
        {nodes.length ? (
          nodes.map((node) => {
            const external = isExternalNode(node);
            const area = insights?.modules.find((module) => module.paths.includes(node.id));
            const bullets = [
              direction === "incoming" ? `Imports ${fileName(focusPath)}.` : `Imported by ${fileName(focusPath)}.`,
              external
                ? "Provides an external package dependency."
                : area
                  ? area.purpose
                  : direction === "incoming"
                    ? "May be affected if its imported API changes."
                    : "Supplies code or values used by this file.",
            ];
            const content = (
              <>
                <div className="flex items-center justify-between gap-2">
                  <strong className="truncate text-sm">
                    {external ? <Package className="mr-1.5 inline size-3.5" /> : null}
                    {node.label}
                  </strong>
                  {!external ? (
                    <ArrowRight className="size-4 shrink-0" />
                  ) : (
                    <span className="text-[10px] font-semibold uppercase">Package</span>
                  )}
                </div>
                <code className="mt-1 block truncate text-[10px] opacity-60">{node.id}</code>
                <ul className="mt-3 space-y-1 text-xs leading-relaxed opacity-80">
                  {bullets.map((bullet) => (
                    <li key={bullet} className="flex gap-1.5">
                      <span aria-hidden="true">•</span>
                      {bullet}
                    </li>
                  ))}
                </ul>
              </>
            );
            const className = cn(
              "block w-full rounded-2xl p-4 text-left text-[#2b3131] shadow-sm dark:text-white",
              direction === "incoming"
                ? "bg-[#f7d9e7] dark:bg-rose-900/50"
                : external
                  ? "bg-[#e6dcf8] dark:bg-violet-900/50"
                  : "bg-[#ffedb5] dark:bg-amber-900/50",
            );
            return external ? (
              <div key={node.id} className={className}>
                {content}
              </div>
            ) : (
              <button
                key={node.id}
                type="button"
                aria-label={`Focus ${node.id}`}
                onClick={() => onFocus(node.id)}
                className={cn(
                  className,
                  "transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500",
                )}
              >
                {content}
              </button>
            );
          })
        ) : (
          <p className="rounded-2xl border border-dashed bg-white/70 p-5 text-xs leading-relaxed text-muted-foreground dark:bg-white/5">
            No direct {direction === "incoming" ? "importers" : "imports"} were found in the parsed files. This can be
            normal for entry points, configuration, or assets.
          </p>
        )}
        {total > nodes.length ? (
          <span className="text-xs text-muted-foreground">+ {total - nodes.length} more · expand below</span>
        ) : null}
      </div>
    </section>
  );
}

function ConnectionLines({ incoming, outgoing }: { incoming: number; outgoing: number }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 1000 420"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-0 hidden size-full xl:block"
    >
      <defs>
        <marker id="connection-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6" fill="context-stroke" />
        </marker>
      </defs>
      {[
        ...Array.from({ length: incoming }, (_, index) => ({
          key: `in-${index}`,
          d: `M 290 ${235 + (index - (incoming - 1) / 2) * 120} C 320 ${235 + (index - (incoming - 1) / 2) * 120}, 310 210, 336 210`,
          color: "#df8fb2",
        })),
        ...Array.from({ length: outgoing }, (_, index) => ({
          key: `out-${index}`,
          d: `M 664 210 C 690 210, 680 ${235 + (index - (outgoing - 1) / 2) * 120}, 707 ${235 + (index - (outgoing - 1) / 2) * 120}`,
          color: "#c9a339",
        })),
      ].map((path) => (
        <path
          key={path.key}
          d={path.d}
          fill="none"
          stroke={path.color}
          strokeWidth="2.5"
          markerEnd="url(#connection-arrow)"
        />
      ))}
    </svg>
  );
}

function ExtraConnections({
  title,
  nodes,
  onFocus,
}: {
  title: string;
  nodes: GraphNode[];
  onFocus: (path: string) => void;
}) {
  return (
    <section className="rounded-2xl bg-white/80 p-4 dark:bg-white/5">
      <h5 className="mb-2 text-xs font-semibold">{title}</h5>
      <div className="flex flex-wrap gap-2">
        {nodes.map((node) =>
          isExternalNode(node) ? (
            <span key={node.id} className="rounded-full bg-violet-100 px-3 py-2 text-xs text-violet-900">
              {node.label}
            </span>
          ) : (
            <button
              key={node.id}
              type="button"
              onClick={() => onFocus(node.id)}
              className="rounded-full border bg-background px-3 py-2 text-left text-xs hover:bg-muted"
              title={node.id}
            >
              {node.id}
            </button>
          ),
        )}
      </div>
    </section>
  );
}
