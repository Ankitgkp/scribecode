import { ArrowLeft, ArrowRight, Check, Flag, GraduationCap, Map, Mic, Route, Sparkles, Trophy } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { UnderstandingLoader } from "@/components/ui/understanding-loader";
import { useFileAnalysis } from "@/features/analysis/hooks/useFileAnalysis";
import type { FileTreeEntry } from "@/features/explorer/types";
import { InterviewCoach } from "@/features/insights/components/InterviewCoach";
import { buildInterviewStory, type StoryStop } from "@/features/insights/lib/interview-story";
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
  const [practiced, setPracticed] = useState<Set<string>>(() => new Set());
  const index = Math.max(
    0,
    stops.findIndex((stop) => stop.path === selectedPath),
  );
  const stop = stops[index];
  const active = started || Boolean(selectedPath);
  const storyStart = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (active) storyStart.current?.scrollIntoView?.({ block: "start" });
  }, [active, stop?.path]);

  if (status === "loading" && !insights)
    return <UnderstandingLoader label="Preparing the big picture for your interview…" />;
  if (error && !insights)
    return (
      <p role="alert" className="rounded-3xl bg-rose-50 p-6 text-destructive">
        {error} Use Sync project to try again.
      </p>
    );
  if (!insights) return null;

  function go(next: number): void {
    const item = stops[next];
    if (item) {
      setStarted(true);
      setComplete(false);
      onSelectFile(item.path);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <section className="relative overflow-hidden rounded-[2rem] bg-[#dff3cb] p-6 text-[#24312c] sm:p-8 dark:bg-[#243b30] dark:text-white">
        <div
          aria-hidden="true"
          className="absolute -top-24 -right-20 size-80 rounded-full border-[50px] border-white/30"
        />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1.5 text-xs font-semibold dark:bg-white/10">
              <GraduationCap className="size-4" /> QUICK INTERVIEW PREPARATION
            </span>
            {active ? (
              <h2 className="mt-3 text-xl font-semibold tracking-tight sm:text-2xl">
                Your project, one chapter at a time.
              </h2>
            ) : (
              <h2 className="mt-4 text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
                Turn “I built this” into
                <br />
                <span className="text-[#638759] dark:text-lime-200">“Here’s how it works.”</span>
              </h2>
            )}
            {!active ? (
              <p className="mt-4 max-w-xl text-sm leading-relaxed opacity-80">
                Walk through your project as a story. Understand each file, practice explaining your choices, and ask
                questions along the way.
              </p>
            ) : null}
          </div>
          {!active ? (
            <div className="relative shrink-0 rounded-[1.7rem] bg-[#263630] p-5 text-white shadow-xl md:w-56">
              <Route className="size-7 text-[#dbf994]" />
              <p className="mt-5 text-3xl font-semibold">
                {stops.length}
                <span className="ml-2 text-sm font-normal text-white/65">story stops</span>
              </p>
              <p className="mt-2 text-xs leading-relaxed text-white/65">
                Entry files → connected pieces → supporting files
              </p>
              <button
                type="button"
                disabled={!stops.length}
                onClick={() => go(active ? index : 0)}
                className="mt-4 flex w-full items-center justify-between rounded-full bg-[#ddfa91] px-4 py-2.5 text-sm font-semibold text-[#25342b] disabled:opacity-50"
              >
                {active ? "Continue story" : "Start my story"}
                <ArrowRight className="size-4" />
              </button>
            </div>
          ) : (
            <span className="relative inline-flex w-fit items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-sm font-medium dark:bg-white/10">
              <Route className="size-4" />
              {stops.length} story stops
            </span>
          )}
        </div>
      </section>

      {!stops.length ? (
        <p className="rounded-3xl bg-muted p-8 text-sm text-muted-foreground">
          There are no files to explore yet. Sync a repository to begin your interview story.
        </p>
      ) : null}

      {complete ? (
        <section className="rounded-3xl bg-[#f4eabd] p-8 text-[#3a3528] dark:bg-amber-950/40 dark:text-white">
          <Trophy className="size-10" />
          <h3 className="mt-4 text-2xl font-semibold">You reached the end of the project story.</h3>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed">
            Now practice your two-minute explanation: what the app does, where it starts, how its main parts connect,
            and one tradeoff you would improve. Finishing the slides is a starting point for practice, not a score of
            interview readiness.
          </p>
          <button
            type="button"
            onClick={() => go(0)}
            className="mt-5 rounded-full bg-[#28392f] px-5 py-3 text-sm font-semibold text-white"
          >
            Revisit the story
          </button>
        </section>
      ) : null}

      {!active && stops.length > 0 ? (
        <section className="grid gap-3 sm:grid-cols-3">
          {[
            {
              icon: Flag,
              title: "Find the beginning",
              text: "Start with likely entry files and see what they bring into the app.",
            },
            {
              icon: Mic,
              title: "Say it in your words",
              text: "Read the crisp explanation, then try the interview checkpoint.",
            },
            {
              icon: Sparkles,
              title: "Go deeper, right here",
              text: "Ask your coach about design decisions, edge cases, or tradeoffs.",
            },
          ].map(({ icon: Icon, title, text }) => (
            <article key={title} className="rounded-3xl bg-[#f2f0f7] p-5 dark:bg-white/5">
              <Icon className="size-6 text-violet-600 dark:text-violet-300" />
              <h3 className="mt-4 font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
            </article>
          ))}
        </section>
      ) : null}

      {active && stop && !complete ? (
        <>
          <div ref={storyStart} className="flex scroll-mt-20 flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold tracking-widest text-teal-700 uppercase dark:text-teal-300">
                Stop {index + 1} of {stops.length} · {stop.chapter}
              </p>
              <h3 className="mt-1 text-xl font-semibold">{fileName(stop.path)}</h3>
            </div>
            <select
              aria-label="Jump to a story file"
              value={stop.path}
              onChange={(event) => {
                setStarted(true);
                onSelectFile(event.target.value);
              }}
              className="max-w-full rounded-full border bg-background px-4 py-2 text-sm sm:max-w-xs"
            >
              {stops.map((item, itemIndex) => (
                <option key={item.path} value={item.path}>
                  {itemIndex + 1}. {item.path}
                </option>
              ))}
            </select>
          </div>
          <div
            role="progressbar"
            aria-label="Project story progress"
            aria-valuemin={0}
            aria-valuemax={stops.length}
            aria-valuenow={index + 1}
            className="h-2 overflow-hidden rounded-full bg-[#edf0eb] dark:bg-white/10"
          >
            <div
              className="h-full rounded-full bg-[#8fc994] transition-all duration-500"
              style={{ width: `${((index + 1) / stops.length) * 100}%` }}
            />
          </div>
          <p className="flex items-center gap-2 text-xs font-medium text-teal-700 dark:text-teal-300">
            <Trophy className="size-4" /> {practiced.size} stops practiced · take the time you need
          </p>
          <StorySlide
            key={stop.path}
            owner={owner}
            name={name}
            stop={stop}
            graph={graph ?? { nodes: [], edges: [] }}
            onSelectFile={(path) => {
              setStarted(true);
              onSelectFile(path);
            }}
            onExploreFile={onExploreFile}
          />
          {stop.readable ? (
            <button
              type="button"
              aria-pressed={practiced.has(stop.path)}
              onClick={() => setPracticed((previous) => new Set([...previous, stop.path]))}
              className="inline-flex w-fit items-center gap-2 rounded-full bg-[#e5f2dd] px-4 py-2 text-sm font-medium text-[#386146] dark:bg-teal-900/40 dark:text-teal-200"
            >
              <Check className="size-4" />
              {practiced.has(stop.path) ? "Practiced — nice work" : "I practiced explaining this stop"}
            </button>
          ) : null}
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              disabled={index === 0}
              onClick={() => go(index - 1)}
              className="inline-flex items-center gap-2 rounded-full border px-4 py-3 text-sm font-medium disabled:opacity-35"
            >
              <ArrowLeft className="size-4" /> Previous
            </button>
            <button
              type="button"
              onClick={() => (index === stops.length - 1 ? setComplete(true) : go(index + 1))}
              className="inline-flex items-center gap-2 rounded-full bg-[#273b31] px-5 py-3 text-sm font-semibold text-white dark:bg-lime-200 dark:text-slate-900"
            >
              {index === stops.length - 1 ? "Finish story" : "Next chapter"}
              <ArrowRight className="size-4" />
            </button>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            This is a suggested reading route based on filenames and parsed imports. Runtime execution can differ. All
            repository files are included; assets and generated files have a lighter stop.
          </p>
        </>
      ) : null}
    </div>
  );
}

function StorySlide({
  owner,
  name,
  stop,
  graph,
  onSelectFile,
  onExploreFile,
}: {
  owner: string;
  name: string;
  stop: StoryStop;
  graph: Graph;
  onSelectFile: (path: string) => void;
  onExploreFile: (path: string) => void;
}) {
  const analysis = useFileAnalysis(owner, name, stop.readable ? stop.path : "");
  const connections = useMemo(() => neighborhood(graph, stop.path), [graph, stop.path]);
  const [revealed, setRevealed] = useState(false);
  return (
    <article className="flex flex-col gap-5">
      <section className="rounded-[1.8rem] bg-[#e6f0ed] p-6 sm:p-8 dark:bg-teal-950/30">
        <p className="flex items-center gap-2 text-xs font-semibold text-teal-700 dark:text-teal-300">
          <Map className="size-4" />
          {stop.from
            ? `We arrived from ${fileName(stop.from)}, which imports this file.`
            : "A new part of the story begins here."}
        </p>
        <code className="mt-4 block break-all text-xs text-muted-foreground">{stop.path}</code>
        {!stop.readable ? (
          <p className="mt-4 text-2xl leading-relaxed font-medium">
            This is an asset or generated file. Its role is to support the project rather than define a step of
            application logic.
          </p>
        ) : analysis.status === "loading" ? (
          <div className="mt-5">
            <UnderstandingLoader label="Reading this chapter of your project…" />
          </div>
        ) : analysis.error ? (
          <div className="mt-4">
            <p role="alert" className="text-sm text-destructive">
              {analysis.error}
            </p>
            <button type="button" onClick={analysis.reload} className="mt-3 rounded-full border px-4 py-2 text-sm">
              Try this chapter again
            </button>
          </div>
        ) : analysis.data ? (
          <>
            <p className="mt-4 max-w-3xl text-2xl leading-relaxed font-medium tracking-tight sm:text-3xl">
              {analysis.data.purpose}
            </p>
            <ul className="mt-5 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
              {analysis.data.highlights.map((highlight) => (
                <li key={highlight} className="flex items-start gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-teal-600" />
                  {highlight}
                </li>
              ))}
            </ul>
          </>
        ) : null}
        <div className="mt-5 flex flex-wrap gap-2">
          {connections.imports.slice(0, 4).map((node) => (
            <button
              key={node.id}
              type="button"
              onClick={() => onSelectFile(node.id)}
              className="rounded-full bg-white/80 px-3 py-2 text-xs font-medium dark:bg-white/10"
            >
              Next connection → {node.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => onExploreFile(stop.path)}
          className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-teal-800 dark:text-teal-200"
        >
          Open this file & its graph <ArrowRight className="size-4" />
        </button>
      </section>
      {stop.readable && analysis.data ? (
        <section className="rounded-3xl bg-[#ffefba] p-5 dark:bg-amber-950/35">
          <h3 className="flex items-center gap-2 font-semibold">
            <Mic className="size-4" /> Interview checkpoint
          </h3>
          <p className="mt-2 text-sm">Explain this file’s purpose and one connection without looking at the answer.</p>
          <button
            type="button"
            aria-expanded={revealed}
            onClick={() => setRevealed(!revealed)}
            className="mt-3 rounded-full bg-white/80 px-4 py-2 text-sm font-medium dark:bg-white/10"
          >
            {revealed ? "Hide speaking notes" : "Reveal speaking notes"}
          </button>
          {revealed ? (
            <div className="mt-4 border-t border-amber-700/20 pt-4 text-sm leading-relaxed">
              <p>{analysis.data.purpose}</p>
              <p className="mt-2">
                {connections.imports.length
                  ? `It imports ${connections.imports
                      .slice(0, 3)
                      .map((node) => node.label)
                      .join(", ")}. Describe what it needs from each dependency using the source.`
                  : "No local imports were found in the parsed graph. Describe this file’s inputs and outputs from the source."}
              </p>
              <p className={cn("mt-2 text-xs", "text-muted-foreground")}>
                Use these as notes. Add your own reasoning and avoid claiming decisions you cannot explain.
              </p>
            </div>
          ) : null}
        </section>
      ) : null}
      {stop.readable ? (
        <InterviewCoach key={stop.path} owner={owner} name={name} path={stop.path} onSelectFile={onSelectFile} />
      ) : null}
    </article>
  );
}
