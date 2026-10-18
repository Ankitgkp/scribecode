import { useRef, type ReactNode, type RefObject } from "react";
import {
  ArrowDown,
  ArrowUpRight,
  Boxes,
  Check,
  ChevronRight,
  CircleHelp,
  Code2,
  FileCode2,
  GitBranch,
  Network,
  PanelLeft,
  Play,
  Sparkles,
  BookOpenText,
  type LucideIcon,
} from "lucide-react";
import { Link, useSearchParams } from "react-router";

import { ConnectGitHubPanel } from "@/features/auth/components/ConnectGitHubPanel";
import { githubOAuthUrl } from "@/features/auth/api";
import { useSession } from "@/features/auth/session-context";
import { AnimatedBeam } from "@/components/ui/animated-beam";
import { HeroGradient } from "@/components/HeroGradient";
import { RepositoryUrlInput } from "@/features/repositories/components/RepositoryUrlInput";

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  invalid_callback: "GitHub returned an unexpected response. Please try connecting again.",
  state_mismatch: "The GitHub sign-in attempt could not be verified. Please try again.",
  oauth_failed: "We could not complete the GitHub sign-in. Please try again.",
};

const steps = [
  {
    number: "01",
    icon: GitBranch,
    title: "Open a repository",
    detail: "Paste a public GitHub URL or connect a private project.",
  },
  {
    number: "02",
    icon: Network,
    title: "Find the structure",
    detail: "See the modules, important files, and the paths between them.",
  },
  {
    number: "03",
    icon: Sparkles,
    title: "Follow the story",
    detail: "Open any file for a guided explanation grounded in its code.",
  },
] as const;

export function HomePage() {
  const { status, user } = useSession();
  const [searchParams] = useSearchParams();
  const authError = searchParams.get("authError");

  return (
    <div className="landing mx-auto w-full max-w-[1380px]">
      <section className="landing-hero relative isolate border-b border-white/10 px-1 pb-16 pt-28 sm:pb-24 sm:pt-32 lg:pb-28 lg:pt-36">
        <div
          className="landing-hero-background pointer-events-none absolute inset-y-0 left-1/2 -z-10 w-screen -translate-x-1/2 overflow-hidden"
          aria-hidden="true"
        >
          <HeroGradient />
        </div>
        <div className="relative z-10">
          <p className="landing-kicker">
            <span className="size-1.5 rounded-full bg-[#c8f39a]" /> YOUR CODEBASE, MADE CLEAR
          </p>
          <h1 className="mt-8 max-w-5xl text-[clamp(3.5rem,9vw,8rem)] leading-[.96] font-medium tracking-[-.075em]">
            See the system
            <br />
            <span className="text-white/75">behind the code.</span>
          </h1>
          <div className="mt-10 grid w-full gap-10 md:mt-12 lg:grid-cols-[minmax(0,1fr)_minmax(320px,440px)] lg:items-end lg:gap-12">
            <div>
              <p className="max-w-lg text-base leading-relaxed text-white/80 sm:text-lg">
                Turn an unfamiliar GitHub repository into a clear picture of its files, architecture, and how everything
                connects.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <PrimaryAction status={status} label={status === "authenticated" ? "Open workspace" : "Connect GitHub"} />
                <a href="#features" className="landing-text-link">
                  Explore the product <ArrowDown className="size-4" />
                </a>
              </div>
            </div>
            <RepositoryUrlInput variant="hero" />
          </div>
          {status === "authenticated" && user ? (
            <p className="mt-7 text-sm text-white/40">Welcome back, {user.name ?? user.login}.</p>
          ) : null}
          {authError ? (
            <p
              role="alert"
              className="mt-7 max-w-xl rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200"
            >
              {AUTH_ERROR_MESSAGES[authError] ?? "GitHub sign-in failed. Please try again."}
            </p>
          ) : null}
        </div>
        <HeroSignal />
      </section>

      <section id="features" className="landing-section scroll-mt-24">
        <SectionIntro
          eyebrow="THE WORKFLOW"
          title="From repository to understanding."
          description="Move from the big picture to the exact line of code, without losing your place."
        />
        <div className="mt-12 grid gap-px overflow-hidden rounded-xl border border-white/10 bg-white/10 md:grid-cols-3">
          {steps.map((step) => (
            <article
              key={step.number}
              className="group min-h-64 bg-[#101210] p-7 transition-colors hover:bg-[#171b17] sm:p-9"
            >
              <div className="flex items-start justify-between text-white/45">
                <step.icon className="size-7 stroke-[1.25] text-[#c8f39a]" />
                <span className="font-mono text-xs">{step.number} / 03</span>
              </div>
              <div className="mt-20">
                <h3 className="text-xl font-medium tracking-tight">{step.title}</h3>
                <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/45">{step.detail}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="explain" className="landing-section border-t border-white/10 scroll-mt-24">
        <SectionIntro
          eyebrow="FILE EXPLANATIONS"
          title={
            <>
              Understand the part.
              <br />
              <span className="text-white/40">Keep the whole in view.</span>
            </>
          }
          description="Open a file and read its purpose, key blocks, and source side by side. Follow its imports and importers whenever you need more context."
        />
        <FilePreview />
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <MiniFeature
            icon={FileCode2}
            title="Purpose first"
            description="Start with a plain-language summary of what the file does."
          />
          <MiniFeature
            icon={Code2}
            title="Code in context"
            description="See explanations beside the code they describe."
          />
          <MiniFeature
            icon={GitBranch}
            title="Follow connections"
            description="Jump to the files that depend on it or that it imports."
          />
        </div>
      </section>

      <section id="architecture" className="landing-section border-t border-white/10 scroll-mt-24">
        <SectionIntro
          eyebrow="ARCHITECTURE MAP"
          title={
            <>
              Zoom out without
              <br />
              <span className="text-white/40">getting lost.</span>
            </>
          }
          description="Explore a grouped view of your repository, then trace the relationships between its modules and files."
        />
        <ArchitectureFlow />
      </section>

      <section id="interview" className="landing-section border-t border-white/10 scroll-mt-24">
        <SectionIntro
          eyebrow="GUIDED PROJECT TOUR"
          title={
            <>
              Know it well enough
              <br />
              <span className="text-white/40">to explain it.</span>
            </>
          }
          description="Follow a reading route through the project. Practice the checkpoints, reveal speaking notes, and ask a source-grounded AI coach when you get stuck."
        />
        <TourPreview />
      </section>

      <section id="connect" className="landing-section border-t border-white/10 scroll-mt-24">
        <div className="grid gap-12 lg:grid-cols-[1fr_minmax(320px,430px)] lg:items-start lg:gap-20">
          <div>
            <p className="landing-kicker">
              <span className="size-1.5 rounded-full bg-[#c8f39a]" /> GET STARTED
            </p>
            <h2 className="mt-7 max-w-xl text-[clamp(2.8rem,5.8vw,5.7rem)] leading-[1.03] font-medium tracking-[-.06em]">
              Make sense of
              <br />
              <span className="text-white/40">your next repo.</span>
            </h2>
            <p className="mt-7 max-w-md text-base leading-relaxed text-white/50">
              Paste a public repository URL to begin, or connect GitHub for private projects.
            </p>
            {status === "authenticated" ? (
              <div className="mt-8">
                <PrimaryAction status={status} label="Choose a repository" />
              </div>
            ) : null}
          </div>
          {status === "anonymous" ? (
            <div className="landing-connect">
              <ConnectGitHubPanel />
            </div>
          ) : null}
          {status === "loading" ? <p className="text-sm text-white/45">Checking your session…</p> : null}
          {status === "authenticated" ? (
            <div className="landing-ready">
              <Check className="size-6 text-[#c8f39a]" />
              <p className="mt-8 text-2xl font-medium">GitHub connected.</p>
              <p className="mt-3 text-sm leading-relaxed text-white/45">
                Your repositories are ready in the workspace.
              </p>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function PrimaryAction({ status, label }: { status: "loading" | "anonymous" | "authenticated"; label: string }) {
  const className =
    "landing-primary inline-flex min-h-12 items-center justify-center gap-3 rounded-lg bg-[#e7f5d8] px-6 text-sm font-semibold text-[#101510] transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c8f39a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0d0b]";
  if (status === "loading")
    return (
      <span className={className + " opacity-50"} aria-busy="true">
        Checking session…
      </span>
    );
  if (status === "authenticated")
    return (
      <Link to="/repositories" className={className}>
        {label}
        <ArrowUpRight className="size-4" />
      </Link>
    );
  return (
    <a href={githubOAuthUrl()} className={className}>
      <GitBranch className="size-4" />
      {label}
      <ArrowUpRight className="size-4" />
    </a>
  );
}

function SectionIntro({ eyebrow, title, description }: { eyebrow: string; title: ReactNode; description: string }) {
  return (
    <div className="grid gap-7 md:grid-cols-[minmax(0,1.05fr)_minmax(300px,.65fr)] md:gap-14">
      <div>
        <p className="landing-kicker text-white/45">{eyebrow}</p>
        <h2 className="mt-7 text-[clamp(2.7rem,5vw,5.1rem)] leading-[1.05] font-medium tracking-[-.06em]">{title}</h2>
      </div>
      <p className="max-w-md self-end text-base leading-relaxed text-white/48 md:pb-1">{description}</p>
    </div>
  );
}

function HeroSignal() {
  return (
    <div className="relative mt-20 select-none sm:mt-28" aria-hidden="true">
      <div className="flex items-center justify-between font-mono text-[10px] tracking-widest text-white/30">
        <span>INPUT / REPOSITORY</span>
        <span>OUTPUT / UNDERSTANDING</span>
      </div>
      <div className="landing-signal mt-5 flex h-16 items-center justify-between border-y border-white/10 px-1 sm:h-20">
        {Array.from({ length: 33 }, (_, index) => (
          <span key={index} className={"w-px bg-white/25 " + (index % 4 === 0 ? "h-6" : "h-3")} />
        ))}
        <span className="absolute left-[27%] grid size-8 place-items-center rounded-full border border-white/20 bg-[#151a14] text-[#c8f39a]">
          <Code2 className="size-3.5" />
        </span>
        <span className="absolute left-[71%] grid size-8 place-items-center rounded-full border border-[#c8f39a]/40 bg-[#c8f39a] text-[#101510]">
          <Network className="size-3.5" />
        </span>
      </div>
      <div className="mt-3 flex justify-between font-mono text-[10px] text-white/25">
        <span>FILES</span>
        <span>MODULES</span>
        <span>STORY</span>
      </div>
    </div>
  );
}

function FilePreview() {
  return (
    <div
      className="landing-preview mt-12 overflow-hidden rounded-xl border border-white/10 bg-[#111411]"
      aria-label="Illustrative file explanation preview"
    >
      <PreviewBar label="FILE EXPLORER" right="Illustrative preview" />
      <div className="grid min-h-[430px] md:grid-cols-[minmax(0,1fr)_minmax(260px,.8fr)] xl:grid-cols-[205px_minmax(0,1fr)_minmax(260px,.78fr)]">
        <div className="hidden border-r border-white/10 p-5 xl:block">
          <div className="flex items-center gap-2 text-xs text-white/35">
            <PanelLeft className="size-4" /> Files
          </div>
          <div className="mt-8 space-y-2 font-mono text-xs text-white/38">
            <p className="text-white/60">⌄ src</p>
            <p className="pl-4">⌄ features</p>
            <p className="pl-8">api.ts</p>
            <p className="rounded-md bg-[#c8f39a]/10 py-2 pl-8 text-[#d4f4b3]">repository.ts</p>
            <p className="pl-8">graph.ts</p>
            <p className="pl-4">app.tsx</p>
            <p className="pl-4">main.tsx</p>
          </div>
        </div>
        <div className="min-w-0 border-b border-white/10 p-5 md:border-b-0 md:border-r md:p-7">
          <div className="flex items-center justify-between text-xs text-white/45">
            <span className="flex items-center gap-2">
              <FileCode2 className="size-4 text-[#c8f39a]" /> repository.ts
            </span>
            <span className="font-mono">TS</span>
          </div>
          <div className="mt-9 space-y-3 font-mono text-xs leading-relaxed">
            <CodeLine n="01" text="async function loadRepository(id) {" />
            <CodeLine n="02" text="  const repo = await getRepo(id);" />
            <CodeLine n="03" text="  const files = await getTree(id);" active />
            <CodeLine n="04" text="  return { repo, files };" active />
            <CodeLine n="05" text="}" />
            <CodeLine n="06" text="" />
            <CodeLine n="07" text="function getEntryFiles(files) {" />
            <CodeLine n="08" text="  return files.filter(isEntry);" />
            <CodeLine n="09" text="}" />
          </div>
          <div className="mt-10 flex items-center gap-2 border-t border-white/10 pt-5 text-xs text-white/35">
            <GitBranch className="size-3.5" /> Imports 3 files <span className="ml-auto">Imported by 2</span>
          </div>
        </div>
        <div className="p-5 md:p-7">
          <p className="landing-kicker text-[#c8f39a]">WHAT THIS FILE DOES</p>
          <h3 className="mt-7 text-2xl leading-tight font-medium tracking-tight">
            Loads a repository and identifies where to begin.
          </h3>
          <p className="mt-5 text-sm leading-relaxed text-white/45">
            The project tree is fetched with the repository, then narrowed to likely entry files for a useful starting
            point.
          </p>
          <div className="mt-9 rounded-xl border border-[#c8f39a]/20 bg-[#c8f39a]/7 p-4">
            <div className="flex items-center gap-2 text-xs font-medium text-[#d8f6bd]">
              <Sparkles className="size-3.5" /> BLOCK EXPLANATION
            </div>
            <p className="mt-3 text-sm leading-relaxed text-white/55">
              Lines 3–4 return the repository together with its file tree.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function CodeLine({ n, text, active = false }: { n: string; text: string; active?: boolean }) {
  return (
    <div
      className={
        "flex gap-4 overflow-hidden whitespace-nowrap rounded-sm px-2 py-0.5 " +
        (active ? "bg-[#c8f39a]/8 text-[#d9eccb]" : "text-white/48")
      }
    >
      <span className="select-none text-white/22">{n}</span>
      <span>{text || "\u00a0"}</span>
    </div>
  );
}

function PreviewBar({ label, right }: { label: string; right: string }) {
  return (
    <div className="flex h-11 items-center justify-between border-b border-white/10 px-5 text-[10px] font-medium tracking-[.14em] text-white/40">
      <span className="flex items-center gap-2">
        <span className="size-1.5 rounded-full bg-[#c8f39a]" /> {label}
      </span>
      <span>{right}</span>
    </div>
  );
}

function MiniFeature({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description: string }) {
  return (
    <div className="min-h-44 rounded-xl border border-white/10 bg-white/[.025] p-6">
      <Icon className="size-5 stroke-[1.5] text-[#c8f39a]" />
      <h3 className="mt-9 text-base font-medium">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-white/40">{description}</p>
    </div>
  );
}

function ArchitectureFlow() {
  const canvas = useRef<HTMLDivElement>(null);
  const repository = useRef<HTMLDivElement>(null);
  const scribecode = useRef<HTMLDivElement>(null);
  const explanations = useRef<HTMLDivElement>(null);
  const architecture = useRef<HTMLDivElement>(null);
  const tour = useRef<HTMLDivElement>(null);

  return (
    <div
      className="landing-preview mt-12 overflow-hidden rounded-xl border border-white/10 bg-[#111411]"
      aria-label="Illustrative Scribecode repository flow"
    >
      <PreviewBar label="FROM CODE TO CONTEXT" right="Illustrative product flow" />
      <div className="relative overflow-hidden p-5 sm:p-8 lg:p-12">
        <div className="landing-map-grid pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />
        <div
          ref={canvas}
          className="relative grid min-h-[620px] grid-cols-1 items-center gap-16 py-6 sm:min-h-[490px] sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.15fr)] sm:gap-10 sm:py-12"
        >
          <AnimatedBeam containerRef={canvas} fromRef={repository} toRef={scribecode} delay={0} />
          <AnimatedBeam containerRef={canvas} fromRef={scribecode} toRef={explanations} delay={0.7} />
          <AnimatedBeam containerRef={canvas} fromRef={scribecode} toRef={architecture} delay={1.2} />
          <AnimatedBeam containerRef={canvas} fromRef={scribecode} toRef={tour} delay={1.7} />
          <FlowNode
            ref={repository}
            icon={GitBranch}
            eyebrow="01 / SOURCE"
            title="GitHub repository"
            detail="The code you want to explore"
          />
          <FlowNode
            ref={scribecode}
            icon={Boxes}
            eyebrow="02 / UNDERSTAND"
            title="Scribecode"
            detail="A connected view of your project"
            featured
          />
          <div className="relative z-10 flex flex-col gap-5">
            <FlowNode ref={explanations} icon={FileCode2} eyebrow="03 / EXPLORE" title="File explanations" compact />
            <FlowNode ref={architecture} icon={Network} eyebrow="04 / CONNECT" title="Architecture map" compact />
            <FlowNode ref={tour} icon={BookOpenText} eyebrow="05 / PRACTICE" title="Guided project tour" compact />
          </div>
        </div>
        <div className="relative grid gap-3 border-t border-white/10 pt-6 text-sm text-white/45 sm:grid-cols-3 sm:gap-8">
          <p>
            <span className="mr-2 font-mono text-[#c8f39a]">01</span> Start with any connected repository.
          </p>
          <p>
            <span className="mr-2 font-mono text-[#c8f39a]">02</span> Follow its files and relationships.
          </p>
          <p>
            <span className="mr-2 font-mono text-[#c8f39a]">03</span> Build a story you can explain.
          </p>
        </div>
      </div>
    </div>
  );
}

function FlowNode({
  ref,
  icon: Icon,
  eyebrow,
  title,
  detail,
  featured = false,
  compact = false,
}: {
  ref: RefObject<HTMLDivElement | null>;
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  detail?: string;
  featured?: boolean;
  compact?: boolean;
}) {
  return (
    <div
      ref={ref}
      className={
        "relative z-10 w-full rounded-lg border shadow-[0_16px_40px_rgba(0,0,0,.24)] " +
        (featured ? "border-[#c8f39a]/45 bg-[#202d22] " : "border-white/15 bg-[#1a1f1a] ") +
        (compact ? "p-4 sm:p-5" : "p-5 sm:p-7")
      }
    >
      <div className="flex items-center gap-3">
        <span
          className={
            "grid size-10 shrink-0 place-items-center rounded-md border " +
            (featured
              ? "border-[#c8f39a]/35 bg-[#c8f39a]/12 text-[#c8f39a]"
              : "border-white/12 bg-white/[.04] text-white/70")
          }
        >
          <Icon className="size-5 stroke-[1.5]" />
        </span>
        <div className="min-w-0">
          <p className="font-mono text-[10px] tracking-[.12em] text-[#c8f39a]/75">{eyebrow}</p>
          <h3 className="mt-1 text-sm font-medium leading-tight text-white sm:text-base">{title}</h3>
        </div>
      </div>
      {detail ? <p className="mt-5 text-xs leading-relaxed text-white/45">{detail}</p> : null}
    </div>
  );
}

function TourPreview() {
  return (
    <div
      className="landing-preview mt-12 overflow-hidden rounded-xl border border-white/10 bg-[#111411]"
      aria-label="Illustrative guided tour preview"
    >
      <PreviewBar label="PROJECT TOUR" right="Illustrative preview" />
      <div className="grid md:grid-cols-[205px_minmax(0,1fr)] xl:grid-cols-[235px_minmax(0,1fr)_300px]">
        <div className="border-b border-white/10 p-6 md:border-b-0 md:border-r">
          <div className="flex items-center gap-2 text-xs text-white/45">
            <Play className="size-3.5 text-[#c8f39a]" /> Reading route
          </div>
          <div className="mt-8 space-y-5">
            <TourStop number="01" title="The entry point" done />
            <TourStop number="02" title="Follow the request" current />
            <TourStop number="03" title="Trace the data" />
            <TourStop number="04" title="Connect the pieces" />
          </div>
        </div>
        <div className="p-6 sm:p-9">
          <div className="flex items-center justify-between text-xs text-white/35">
            <span>CHAPTER 02 / 04</span>
            <span>FILE 04 / 18</span>
          </div>
          <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-[37%] rounded-full bg-[#c8f39a]" />
          </div>
          <h3 className="mt-12 max-w-md text-[clamp(1.7rem,3vw,2.8rem)] leading-tight tracking-tight">
            Follow a request through the app.
          </h3>
          <p className="mt-5 max-w-lg text-sm leading-relaxed text-white/45">
            Start at the route, open the service it calls, and see where the response is shaped.
          </p>
          <div className="mt-10 rounded-xl border border-white/10 bg-black/20 p-4 font-mono text-xs text-white/50">
            <span className="text-[#c8f39a]">routes/repositories.ts</span>
            <p className="mt-3">router.get("/:owner/:name", getRepository);</p>
          </div>
        </div>
        <div className="border-t border-white/10 bg-[#171b17] p-6 md:col-span-2 xl:col-span-1 xl:border-l xl:border-t-0">
          <p className="landing-kicker text-[#c8f39a]">SPEAKING CHECKPOINT</p>
          <h4 className="mt-8 text-xl leading-snug">Can you explain how a repository is loaded?</h4>
          <p className="mt-5 text-sm leading-relaxed text-white/45">
            Use this stop to practice the story in your own words.
          </p>
          <div className="mt-10 flex items-center gap-2 rounded-lg border border-white/10 px-3 py-3 text-xs text-white/65">
            <CircleHelp className="size-4 text-[#c8f39a]" /> Ask the AI coach{" "}
            <ChevronRight className="ml-auto size-4" />
          </div>
        </div>
      </div>
    </div>
  );
}

function TourStop({
  number,
  title,
  done = false,
  current = false,
}: {
  number: string;
  title: string;
  done?: boolean;
  current?: boolean;
}) {
  return (
    <div className={"flex items-center gap-3 text-xs " + (current ? "text-[#d9f7bd]" : "text-white/35")}>
      <span
        className={
          "grid size-7 shrink-0 place-items-center rounded-full border font-mono " +
          (current ? "border-[#c8f39a] bg-[#c8f39a]/10" : "border-white/15")
        }
      >
        {done ? <Check className="size-3.5" /> : number}
      </span>
      <span>{title}</span>
    </div>
  );
}
