import { ArrowRight, ArrowUpRight, Blocks, FileCode2, GitBranch, Sparkles } from "lucide-react";
import { UnderstandingLoader } from "@/components/ui/understanding-loader";

import type { ProjectInsights } from "@/features/insights/types";
import { cn } from "@/lib/utils";

interface ProjectTourProps {
  insights: ProjectInsights | null;
  status: "loading" | "success" | "error";
  error: string | null;
  onSelectFile: (path: string) => void;
  onShowMap: () => void;
}

const TONES = [
  "bg-[#d8ece7] dark:bg-teal-900/50",
  "bg-[#f9e1eb] dark:bg-rose-900/50",
  "bg-[#e4dcf4] dark:bg-violet-900/50",
];

export function ProjectTour({ insights, status, error, onSelectFile, onShowMap }: ProjectTourProps) {
  const loading = status === "loading";

  return (
    <div className="flex flex-col gap-6">
      <section className="relative overflow-hidden rounded-2xl bg-[#e6efed] p-6 text-[#1c2928] sm:p-8 lg:p-10 dark:bg-[#203630] dark:text-white">
        <div className="pointer-events-none absolute -top-24 right-[-4rem] size-72 rounded-full border-[35px] border-white/40 dark:border-white/5" />
        <div className="pointer-events-none absolute right-20 -bottom-36 size-72 rounded-full border-[42px] border-[#c5dfd9]/70 dark:border-emerald-500/10" />
        <div className="relative grid items-center gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(250px,.85fr)]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/75 px-3 py-1.5 text-xs font-semibold tracking-[.12em] text-teal-800 uppercase dark:bg-white/10 dark:text-teal-100">
              <Sparkles className="size-3.5" /> Your project, explained
            </span>
            <h2 className="mt-5 max-w-2xl text-3xl leading-[1.08] font-semibold tracking-[-.045em] sm:text-4xl lg:text-5xl">
              Get the big picture <span className="text-[#66867d] dark:text-[#a5d4c5]">before the code.</span>
            </h2>
            {loading && !insights ? (
              <div className="mt-5">
                <UnderstandingLoader compact label="Reading your project…" />
              </div>
            ) : null}
            {error ? (
              <p role="alert" className="mt-5 text-sm text-red-700 dark:text-red-300">
                {error}
              </p>
            ) : null}
            {insights ? (
              <p className="mt-5 max-w-xl text-base leading-relaxed text-[#3f5b56] dark:text-teal-50/80">
                {insights.summary}
              </p>
            ) : null}
            <div className="mt-7 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onShowMap}
                className="inline-flex items-center gap-3 rounded-lg bg-[#202c2b] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_-15px_rgba(11,35,30,.9)] transition hover:-translate-y-0.5 hover:bg-[#334844] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 dark:bg-[#dcfa96] dark:text-[#16221c]"
              >
                Explore connections <ArrowUpRight className="size-4" />
              </button>
            </div>
          </div>

          <div aria-hidden="true" className="relative hidden min-h-[260px] lg:block">
            <div className="absolute top-2 right-16 left-4 h-28 rotate-[-8deg] rounded-xl bg-[#f9dded] p-5 shadow-[0_15px_28px_-18px_rgba(43,50,48,.35)] dark:bg-rose-900/70">
              <Blocks className="mb-4 size-6" />
              <span className="block truncate text-lg font-semibold">
                {insights?.modules[0]?.name ?? "Your features"}
              </span>
            </div>
            <div className="absolute top-20 right-0 left-20 h-28 rotate-[7deg] rounded-xl bg-[#e4dbf8] p-5 shadow-[0_15px_28px_-18px_rgba(43,50,48,.35)] dark:bg-violet-900/70">
              <GitBranch className="mb-4 size-6" />
              <span className="block truncate text-lg font-semibold">{insights?.modules[1]?.name ?? "The logic"}</span>
            </div>
            <div className="absolute top-40 right-12 left-8 h-28 rotate-[-3deg] rounded-xl bg-[#ffebad] p-5 shadow-[0_15px_28px_-18px_rgba(43,50,48,.35)] dark:bg-amber-900/70">
              <FileCode2 className="mb-4 size-6" />
              <span className="block truncate text-lg font-semibold">{insights?.modules[2]?.name ?? "Your files"}</span>
            </div>
          </div>
        </div>
      </section>

      {insights ? (
        <>
          {insights.limitedAnalysis ? (
            <p className="rounded-xl bg-[#fff0ce] px-5 py-3 text-sm dark:bg-amber-900/30">
              This tour uses the file structure. Direct import connections are supported for JavaScript and TypeScript
              files.
            </p>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard
              value={insights.modules.length}
              label="feature areas"
              description="The main parts of your app"
              tone="bg-[#e8ddf6] dark:bg-violet-900/45"
            />
            <StatCard
              value={insights.startHere.length}
              label="starting files"
              description="Best places to begin"
              tone="bg-[#ffedba] dark:bg-amber-900/45"
            />
            <StatCard
              value={insights.flows.length}
              label="user journeys"
              description="Ways the app comes together"
              tone="bg-[#d7ece7] dark:bg-teal-900/45"
            />
          </div>

          <section>
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <span className="text-xs font-semibold tracking-[.14em] text-teal-700 uppercase dark:text-teal-300">
                  Your first stops
                </span>
                <h3 className="mt-1 text-2xl font-semibold tracking-tight">Start here</h3>
              </div>
              <p className="max-w-sm text-sm text-muted-foreground">
                A few files that tell the story of how this project is built.
              </p>
            </div>
            {insights.startHere.length ? (
              <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {insights.startHere.map((file, index) => (
                  <li key={file.path}>
                    <button
                      type="button"
                      onClick={() => onSelectFile(file.path)}
                      className={cn(
                        "group flex h-full min-h-48 w-full flex-col justify-between rounded-xl p-5 text-left transition hover:-translate-y-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600",
                        TONES[index % TONES.length],
                      )}
                    >
                      <span className="flex items-start justify-between">
                        <span className="grid size-11 place-items-center rounded-full bg-white/75 shadow-sm dark:bg-black/20">
                          <FileCode2 className="size-5" />
                        </span>
                        <span className="grid size-10 place-items-center rounded-full bg-white/75 transition group-hover:rotate-45 dark:bg-black/20">
                          <ArrowUpRight className="size-5" />
                        </span>
                      </span>
                      <span>
                        <strong className="block break-words text-lg leading-tight">{file.label}</strong>
                        <code className="mt-1 block truncate text-xs opacity-65">{file.path}</code>
                        <span className="mt-3 block text-sm leading-snug opacity-75">{file.reason}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-xl bg-muted px-5 py-8 text-sm text-muted-foreground">
                No starting files were identified yet. Browse the tree to explore the project.
              </p>
            )}
          </section>

          <section className="grid gap-4 rounded-2xl bg-[#252b2b] p-6 text-white sm:grid-cols-[1fr_auto] sm:items-center sm:p-8">
            <div>
              <span className="text-xs font-semibold tracking-[.14em] text-[#c2e8d9] uppercase">
                Next, see how it works
              </span>
              <h3 className="mt-2 text-xl font-semibold">Follow the lines between files.</h3>
              <p className="mt-2 max-w-xl text-sm text-white/65">
                See which files depend on each other, then jump straight to an explanation.
              </p>
            </div>
            <button
              type="button"
              onClick={onShowMap}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#ddf88e] px-5 py-3 text-sm font-semibold text-[#243027] hover:bg-[#d0ed79]"
            >
              Open the map <ArrowRight className="size-4" />
            </button>
          </section>

          {insights.integrations.length ? (
            <section className="flex flex-wrap items-center gap-2">
              <span className="mr-1 text-xs font-semibold tracking-[.14em] text-muted-foreground uppercase">
                Connected tools
              </span>
              {insights.integrations.map((integration) => (
                <span
                  key={integration}
                  className="rounded-full border bg-white px-3 py-1.5 text-xs font-medium dark:bg-white/10"
                >
                  {integration}
                </span>
              ))}
            </section>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

function StatCard({
  value,
  label,
  description,
  tone,
}: {
  value: number;
  label: string;
  description: string;
  tone: string;
}) {
  return (
    <div className={cn("rounded-xl p-5", tone)}>
      <span className="text-3xl font-semibold tracking-tight">{value}</span>
      <span className="ml-2 text-sm font-semibold">{label}</span>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
