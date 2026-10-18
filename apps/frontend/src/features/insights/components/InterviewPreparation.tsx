import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  Code2,
  GraduationCap,
  MessageCircle,
  Mic,
  Play,
  Trophy,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";

import { UnderstandingLoader } from "@/components/ui/understanding-loader";
import { useFileAnalysis } from "@/features/analysis/hooks/useFileAnalysis";
import { useFileContent } from "@/features/explorer/hooks/useFileContent";
import type { FileTreeEntry } from "@/features/explorer/types";
import { InterviewCoach } from "@/features/insights/components/InterviewCoach";
import { useInterviewPreload } from "@/features/insights/hooks/useInterviewPreload";
import { buildInterviewStory, type StoryStop } from "@/features/insights/lib/interview-story";
import { storyCodeExcerpt } from "@/features/insights/lib/story-code";
import type { ProjectInsights } from "@/features/insights/types";
import { fileName, neighborhood } from "@/features/visualization/lib/graph";
import { cn } from "@/lib/utils";
import type { Graph } from "@/types/graph";

interface InterviewPreparationProps {
  owner: string;
  name: string;
  insights: ProjectInsights | null;
  graph: Graph | null;
  tree: FileTreeEntry[];
  status: "loading" | "success" | "error";
  error: string | null;
  selectedPath: string;
  onSelectFile: (path: string) => void;
  onExploreFile: (path: string) => void;
}
type HelpPanel = "coach" | "notes" | null;

export function InterviewPreparation({
  owner,
  name,
  insights,
  graph,
  tree,
  status,
  error,
  selectedPath,
  onSelectFile,
  onExploreFile,
}: InterviewPreparationProps) {
  const stops = useMemo(
    () => (insights ? buildInterviewStory(tree, graph ?? { nodes: [], edges: [] }, insights) : []),
    [tree, graph, insights],
  );
  const [started, setStarted] = useState(false);
  const [complete, setComplete] = useState(false);
  const [help, setHelp] = useState<HelpPanel>(null);
  const [practiced, setPracticed] = useState<Set<string>>(() => new Set());
  const index = Math.max(
    0,
    stops.findIndex((stop) => stop.path === selectedPath),
  );
  const stop = stops[index];
  const active = started || Boolean(selectedPath);
  const stage = useRef<HTMLDivElement>(null);
  useInterviewPreload(owner, name, stops, index, active && !complete);

  function go(next: number): void {
    const item = stops[next];
    if (item) {
      setStarted(true);
      setComplete(false);
      setHelp(null);
      onSelectFile(item.path);
    } else if (next === stops.length) {
      setComplete(true);
      setHelp(null);
    }
  }
  useSlideNavigation(stage, index, stops.length, active && !complete && help === null, go);

  if (status === "loading" && !insights)
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <UnderstandingLoader label="Preparing your project story…" />
      </div>
    );
  if (error && !insights)
    return (
      <p role="alert" className="rounded-2xl bg-rose-50 p-6 text-destructive">
        {error} Use Sync project to try again.
      </p>
    );
  if (!insights) return null;

  if (!stops.length)
    return (
      <div className="flex flex-1 items-center justify-center rounded-2xl bg-muted p-8 text-center text-sm text-muted-foreground">
        No files to explore yet. Sync a repository to begin.
      </div>
    );
  if (complete)
    return (
      <section className="flex min-h-0 flex-1 flex-col items-center justify-center gap-5 rounded-2xl bg-[#f1f0e6] p-6 text-center dark:bg-amber-950/20">
        <Trophy className="size-10 text-amber-600" />
        <h2 className="text-2xl font-semibold">That’s your project story.</h2>
        <p className="max-w-lg text-sm leading-relaxed text-muted-foreground">
          You practiced {practiced.size} stops. Try explaining the app in two minutes: what it does, where it starts,
          how its pieces connect, and one tradeoff you would improve.
        </p>
        <button
          type="button"
          onClick={() => go(0)}
          className="rounded-lg bg-[#293d32] px-5 py-3 text-sm font-semibold text-white"
        >
          Revisit the story
        </button>
      </section>
    );

  if (!active || !stop)
    return (
      <section className="relative flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden rounded-xl bg-[#eef3ec] px-6 py-8 text-center dark:bg-[#25322b]">
        <span className="mb-5 flex items-center gap-2 rounded-full bg-white/70 px-3 py-2 text-xs font-semibold dark:bg-white/10">
          <GraduationCap className="size-4" /> INTERVIEW STORY
        </span>
        <h2 className="max-w-2xl text-3xl leading-tight font-semibold tracking-tight sm:text-5xl">
          One file. One clear idea.
          <br />
          <span className="text-[#748972] dark:text-lime-200">Your project, chapter by chapter.</span>
        </h2>
        <p className="mt-5 max-w-md text-sm leading-relaxed text-muted-foreground">
          See the key code, understand its purpose, then move to the next chapter. Your coach is one click away whenever
          you need more.
        </p>
        <button
          type="button"
          onClick={() => go(0)}
          className="mt-7 inline-flex items-center gap-3 rounded-lg bg-[#2a3e32] px-6 py-3 text-sm font-semibold text-white"
        >
          <Play className="size-4" />
          Start my story
        </button>
        <p className="mt-4 text-xs text-muted-foreground">
          {stops.length} chapters · Scroll, swipe, or use the arrow keys
        </p>
      </section>
    );

  return (
    <div
      ref={stage}
      tabIndex={0}
      aria-label="Interview story slides"
      className="flex min-h-0 flex-1 flex-col gap-4 outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
    >
      <header className="mx-auto flex w-full max-w-[1320px] shrink-0 items-center justify-between gap-3 px-1">
        <div className="min-w-0">
          <p className="truncate text-[10px] font-semibold tracking-widest text-teal-700 uppercase dark:text-teal-300">
            Chapter {index + 1} / {stops.length} · {stop.chapter}
          </p>
          <h2 className="mt-0.5 truncate text-lg font-semibold tracking-tight">{fileName(stop.path)}</h2>
        </div>
        <select
          aria-label="Jump to a story file"
          value={stop.path}
          onChange={(event) => go(stops.findIndex((item) => item.path === event.target.value))}
          className="max-w-[45%] rounded-full border bg-background px-3 py-2 text-xs sm:max-w-xs"
        >
          {stops.map((item, itemIndex) => (
            <option key={item.path} value={item.path}>
              {itemIndex + 1}. {item.path}
            </option>
          ))}
        </select>
      </header>
      <div
        role="progressbar"
        aria-label="Project story progress"
        aria-valuemin={0}
        aria-valuemax={stops.length}
        aria-valuenow={index + 1}
        className="mx-auto h-1 w-full max-w-[1320px] shrink-0 overflow-hidden rounded-full bg-[#edf0eb] dark:bg-white/10"
      >
        <div
          className="h-full rounded-full bg-[#9eb69e] transition-all duration-300 motion-reduce:transition-none"
          style={{ width: `${((index + 1) / stops.length) * 100}%` }}
        />
      </div>
      <StorySlide
        key={stop.path}
        owner={owner}
        name={name}
        stop={stop}
        graph={graph ?? { nodes: [], edges: [] }}
        panel={help}
        onPanel={setHelp}
        onSelectFile={(path) => go(stops.findIndex((item) => item.path === path))}
        onExploreFile={onExploreFile}
      />
      <footer className="mx-auto flex w-full max-w-[1320px] shrink-0 items-center justify-between gap-2 border-t pt-3">
        <button
          type="button"
          disabled={index === 0}
          onClick={() => go(index - 1)}
          className="inline-flex items-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-medium disabled:opacity-30 sm:px-4 sm:text-sm"
        >
          <ArrowLeft className="size-4" />
          <span className="hidden sm:inline">Previous</span>
          <span className="sr-only sm:hidden">Previous</span>
        </button>
        <div className="min-w-0 text-center">
          <button
            type="button"
            aria-pressed={practiced.has(stop.path)}
            aria-label={practiced.has(stop.path) ? "Practiced — nice work" : "I practiced explaining this stop"}
            onClick={() => setPracticed((previous) => new Set([...previous, stop.path]))}
            className={cn(
              "inline-flex items-center gap-1.5 text-xs",
              practiced.has(stop.path) ? "text-teal-700 dark:text-teal-300" : "text-muted-foreground",
            )}
          >
            <Check className="size-3.5" />
            {practiced.has(stop.path) ? "Practiced" : "Mark practiced"}
          </button>
          <p className="mt-0.5 hidden text-[10px] text-muted-foreground sm:block">Scroll or swipe to change chapters</p>
        </div>
        <button
          type="button"
          onClick={() => go(index + 1)}
          className="inline-flex items-center gap-2 rounded-lg bg-[#293e32] px-4 py-2.5 text-xs font-semibold text-white sm:px-5 sm:text-sm dark:bg-[#dce8d3] dark:text-[#273a2e]"
        >
          {index === stops.length - 1 ? "Finish story" : "Next chapter"}
          <ArrowRight className="size-4" />
        </button>
      </footer>
    </div>
  );
}

function StorySlide({
  owner,
  name,
  stop,
  graph,
  panel,
  onPanel,
  onSelectFile,
  onExploreFile,
}: {
  owner: string;
  name: string;
  stop: StoryStop;
  graph: Graph;
  panel: HelpPanel;
  onPanel: (panel: HelpPanel) => void;
  onSelectFile: (path: string) => void;
  onExploreFile: (path: string) => void;
}) {
  const analysis = useFileAnalysis(owner, name, stop.readable ? stop.path : "");
  const file = useFileContent(owner, name, stop.readable ? stop.path : "");
  const [selectedBlock, setSelectedBlock] = useState<number | null>(null);
  const excerpt = storyCodeExcerpt(file.data?.content ?? "", analysis.data?.blocks ?? [], selectedBlock);
  const connections = useMemo(() => neighborhood(graph, stop.path), [graph, stop.path]);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (panel && !element.open) {
      if (element.showModal) element.showModal();
      else element.setAttribute("open", "");
    } else if (!panel && element.open) {
      if (element.close) element.close();
      else element.removeAttribute("open");
    }
    return () => {
      if (element.open && element.close) element.close();
    };
  }, [panel]);

  return (
    <>
      <article
        data-story-scroll
        className="story-enter mx-auto grid min-h-0 min-w-0 w-full max-w-[1320px] flex-1 grid-cols-1 grid-rows-[minmax(260px,1fr)_minmax(260px,1fr)] gap-4 overflow-y-auto lg:max-h-[540px] lg:grid-cols-[minmax(0,1.1fr)_minmax(340px,.9fr)] lg:grid-rows-1 lg:overflow-visible"
      >
        <section
          aria-label="Key code"
          className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border border-[#344139] bg-[#252e2a] text-[#e6eee7]"
        >
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4 py-2 text-[11px]">
            <span className="flex min-w-0 items-center gap-2">
              <Code2 className="size-3.5 shrink-0 text-[#a8c6b7]" />
              <code className="truncate">{stop.path}</code>
            </span>
            {analysis.data?.blocks.length ? (
              <select
                aria-label="Key code section"
                value={excerpt.index}
                onChange={(event) => setSelectedBlock(Number(event.target.value))}
                className="max-w-[45%] rounded-lg bg-[#34423a] px-2 py-1 text-[11px]"
              >
                {analysis.data.blocks.map((block, blockIndex) => (
                  <option key={`${block.name}-${block.startLine}`} value={blockIndex}>
                    {block.name}
                  </option>
                ))}
              </select>
            ) : (
              <span className="shrink-0 text-white/45">Key lines</span>
            )}
          </div>
          {!stop.readable ? (
            <p className="m-auto p-4 text-sm text-white/60">Asset or generated file · no source preview needed.</p>
          ) : file.status === "loading" ? (
            <div className="m-auto w-full max-w-md p-4">
              <UnderstandingLoader label="Loading the key code…" />
            </div>
          ) : file.error ? (
            <div className="m-auto p-4 text-sm">
              <p role="alert" className="text-rose-200">
                {file.error}
              </p>
              <button type="button" onClick={file.reload} className="mt-2 underline">
                Retry source
              </button>
            </div>
          ) : (
            <pre
              data-story-scroll
              tabIndex={0}
              aria-label={`Key code from ${stop.path}`}
              className="min-h-0 flex-1 overflow-auto px-4 py-2 font-mono text-[11px] leading-[1.35] sm:text-xs"
            >
              <code>
                {excerpt.lines.map((line) => (
                  <span key={line.number} className="block">
                    <span aria-hidden="true" className="mr-4 inline-block w-6 select-none text-right text-white/30">
                      {line.number}
                    </span>
                    {line.text || " "}
                  </span>
                ))}
              </code>
            </pre>
          )}
        </section>
        <section className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border border-[#dfe5df] bg-[#f2f5f0] dark:border-white/10 dark:bg-[#243028]">
          <div data-story-scroll className="min-h-0 flex-1 overflow-auto px-5 pt-5 sm:px-7 sm:pt-7">
            <p className="mb-2 text-[10px] font-semibold tracking-widest text-[#6b8174] uppercase dark:text-teal-200">
              {stop.from ? `From ${fileName(stop.from)} → ${fileName(stop.path)}` : "Why this file matters"}
            </p>
            {!stop.readable ? (
              <p className="text-lg leading-snug font-medium">
                This file supports the project as an asset or generated output. It isn’t a step in the application’s
                logic.
              </p>
            ) : analysis.status === "loading" ? (
              <UnderstandingLoader compact label="Finding the idea behind this code…" />
            ) : analysis.error ? (
              <div>
                <p role="alert" className="text-sm text-destructive">
                  {analysis.error}
                </p>
                <button type="button" onClick={analysis.reload} className="mt-2 text-sm underline">
                  Try this chapter again
                </button>
              </div>
            ) : analysis.data ? (
              <>
                <p className="max-w-[36rem] text-lg leading-[1.35] font-medium tracking-tight sm:text-xl xl:text-[1.4rem]">
                  {analysis.data.purpose}
                </p>
                <ul className="mt-6 grid max-w-[36rem] gap-3 border-t border-[#d6dfd5] pt-5 text-sm leading-relaxed text-muted-foreground dark:border-white/10">
                  {analysis.data.highlights.slice(0, 3).map((highlight) => (
                    <li key={highlight} className="flex gap-2.5">
                      <span aria-hidden="true" className="mt-[0.55em] size-1.5 shrink-0 rounded-full bg-[#709579] dark:bg-[#b9d6bc]" />
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-4 px-5 py-3 text-xs sm:px-7">
            {stop.readable ? (
              <>
                <button
                  type="button"
                  onClick={() => onPanel("coach")}
                  className="inline-flex items-center gap-1.5 font-semibold text-[#3b6253] dark:text-teal-200"
                >
                  <MessageCircle className="size-3.5" />
                  Ask coach
                </button>
                <button
                  type="button"
                  onClick={() => onPanel("notes")}
                  className="inline-flex items-center gap-1.5 text-muted-foreground"
                >
                  <Mic className="size-3.5" />
                  Speaking notes
                </button>
              </>
            ) : null}
            <button
              type="button"
              onClick={() => onExploreFile(stop.path)}
              className="ml-auto inline-flex items-center gap-1 text-muted-foreground"
            >
              Open file
              <ArrowUpRight className="size-3.5" />
            </button>
          </div>
        </section>
      </article>
      <dialog
        ref={dialog}
        aria-label={panel === "coach" ? "Interview coach" : "Speaking notes"}
        onClose={() => onPanel(null)}
        className="story-help fixed inset-y-4 right-4 left-auto m-0 max-h-[calc(100dvh-2rem)] w-[min(520px,calc(100vw-2rem))] max-w-none overflow-auto rounded-2xl border bg-background p-5 text-foreground shadow-2xl"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground">{fileName(stop.path)}</p>
            <h3 className="mt-1 text-lg font-semibold">
              {panel === "coach" ? "A little more context" : "Practice this chapter"}
            </h3>
          </div>
          <button
            type="button"
            aria-label="Close chapter details"
            onClick={() => onPanel(null)}
            className="grid size-9 place-items-center rounded-full bg-muted"
          >
            <X className="size-4" />
          </button>
        </div>
        <div hidden={panel !== "coach"}>
          <InterviewCoach owner={owner} name={name} path={stop.path} onSelectFile={onSelectFile} />
        </div>
        <div hidden={panel !== "notes"} className="space-y-4 text-sm leading-relaxed">
          <p className="rounded-xl bg-[#f4efdb] p-4 dark:bg-amber-950/20">
            Explain this file’s purpose and one connection in your own words. Then compare with the notes below.
          </p>
          {analysis.data ? (
            <>
              <p>{analysis.data.purpose}</p>
              <ul className="space-y-2 text-muted-foreground">
                {analysis.data.highlights.map((highlight) => (
                  <li key={highlight}>· {highlight}</li>
                ))}
              </ul>
            </>
          ) : null}
          <p>
            {connections.imports.length
              ? `It imports ${connections.imports
                  .slice(0, 3)
                  .map((node) => node.label)
                  .join(", ")}. Describe what it needs from each dependency using the source.`
              : "No local imports were found in the parsed graph. Describe the inputs and outputs you see in the code."}
          </p>
          <div className="flex flex-wrap gap-2">
            {connections.imports.slice(0, 4).map((node) => (
              <button
                key={node.id}
                type="button"
                onClick={() => onSelectFile(node.id)}
                className="rounded-full border px-3 py-1.5 text-xs"
              >
                Follow {node.label} →
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            The story follows filenames and imports. This is a reading route, not a runtime trace.
          </p>
        </div>
      </dialog>
    </>
  );
}

function useSlideNavigation(
  ref: RefObject<HTMLDivElement | null>,
  index: number,
  total: number,
  enabled: boolean,
  navigate: (index: number) => void,
) {
  const navigateRef = useRef(navigate);
  const lockedUntil = useRef(0);
  navigateRef.current = navigate;
  useEffect(() => {
    const element = ref.current;
    if (!element || !enabled) return;
    let accumulated = 0;
    let lastWheel = 0;
    let touch: { x: number; y: number } | null = null;
    function isContentScroll(target: EventTarget | null): boolean {
      if (!(target instanceof Element)) return true;
      if (target.closest("button, a, input, textarea, select, dialog")) return true;
      const scrollArea = target.closest<HTMLElement>("[data-story-scroll]");
      return Boolean(scrollArea && scrollArea.scrollHeight > scrollArea.clientHeight + 16);
    }
    function move(direction: number): boolean {
      const next = index + direction;
      if (next < 0 || next > total) return false;
      navigateRef.current(next);
      return true;
    }
    function wheel(event: WheelEvent): void {
      if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY) || isContentScroll(event.target)) return;
      event.preventDefault();
      const now = Date.now();
      if (now < lockedUntil.current) return;
      if (now - lastWheel > 220 || Math.sign(event.deltaY) !== Math.sign(accumulated)) accumulated = 0;
      lastWheel = now;
      accumulated += event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 400 : 1);
      if (Math.abs(accumulated) >= 110) {
        lockedUntil.current = now + 850;
        move(accumulated > 0 ? 1 : -1);
        accumulated = 0;
      }
    }
    function key(event: KeyboardEvent): void {
      if (isContentScroll(event.target) || event.repeat || event.altKey || event.metaKey || event.ctrlKey) return;
      if (["ArrowRight", "ArrowDown", "PageDown", "ArrowLeft", "ArrowUp", "PageUp"].includes(event.key)) {
        event.preventDefault();
        move(["ArrowRight", "ArrowDown", "PageDown"].includes(event.key) ? 1 : -1);
      }
    }
    function touchStart(event: TouchEvent): void {
      const point = event.touches[0];
      touch = point && !isContentScroll(event.target) ? { x: point.clientX, y: point.clientY } : null;
    }
    function touchEnd(event: TouchEvent): void {
      const point = event.changedTouches[0];
      if (
        touch &&
        point &&
        Math.abs(touch.y - point.clientY) > 70 &&
        Math.abs(touch.y - point.clientY) > Math.abs(touch.x - point.clientX)
      )
        move(touch.y > point.clientY ? 1 : -1);
      touch = null;
    }
    element.addEventListener("wheel", wheel, { passive: false });
    element.addEventListener("keydown", key);
    element.addEventListener("touchstart", touchStart, { passive: true });
    element.addEventListener("touchend", touchEnd, { passive: true });
    return () => {
      element.removeEventListener("wheel", wheel);
      element.removeEventListener("keydown", key);
      element.removeEventListener("touchstart", touchStart);
      element.removeEventListener("touchend", touchEnd);
    };
  }, [ref, index, total, enabled]);
}
