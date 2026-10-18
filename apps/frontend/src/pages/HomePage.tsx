import { ArrowRight, FileCode, GraduationCap, Network, Waypoints } from "lucide-react";
import { Link, useSearchParams } from "react-router";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConnectGitHubPanel } from "@/features/auth/components/ConnectGitHubPanel";
import { useSession } from "@/features/auth/session-context";
import { HealthStatus } from "@/features/health/components/HealthStatus";

const capabilities = [
  {
    icon: GraduationCap,
    title: "Prepare to explain your project",
    description: "Follow a story through your files, practice interview checkpoints, and ask your AI coach for help.",
  },
  {
    icon: FileCode,
    title: "Understand a single file",
    description: "Read the source next to an AI explanation of what it does and what it depends on.",
  },
  {
    icon: Waypoints,
    title: "See how files connect",
    description: "Interactive dependency graphs show imports between files and third-party packages.",
  },
  {
    icon: Network,
    title: "Zoom out to architecture",
    description: "AI-generated architecture maps turn a large codebase into a diagram you can read.",
  },
] as const;

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  invalid_callback: "GitHub returned an unexpected response. Please try connecting again.",
  state_mismatch: "The GitHub sign-in attempt could not be verified. Please try again.",
  oauth_failed: "We could not complete the GitHub sign-in. Please try again.",
};

export function HomePage() {
  const { status, user } = useSession();
  const [searchParams] = useSearchParams();
  const authError = searchParams.get("authError");

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
      <section className="relative overflow-hidden rounded-[2rem] bg-[#def1cd] p-8 text-[#293c2e] sm:p-12 dark:bg-[#243b30] dark:text-white">
        <GraduationCap aria-hidden="true" className="absolute -right-5 -bottom-5 size-48 -rotate-12 opacity-10" />
        <p className="relative flex items-center gap-2 text-xs font-semibold tracking-widest uppercase">
          <GraduationCap className="size-4" /> Your project. Your interview story.
        </p>
        <h1 className="relative mt-5 max-w-2xl text-4xl leading-tight font-semibold tracking-tight sm:text-5xl">
          You built it.
          <br />
          <span className="text-[#69845b] dark:text-lime-200">Now explain it with confidence.</span>
        </h1>
        <p className="relative mt-5 max-w-xl text-base leading-relaxed opacity-80">
          Connect your GitHub project and turn it into an interactive interview walkthrough. Understand what every file
          does, follow its connections, and practice telling the story.
        </p>
      </section>

      {authError ? (
        <p className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {AUTH_ERROR_MESSAGES[authError] ?? "GitHub sign-in failed. Please try again."}
        </p>
      ) : null}

      {status === "loading" ? <p className="text-sm text-muted-foreground">Checking your session…</p> : null}

      {status === "authenticated" && user ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Welcome back, {user.name ?? user.login}</CardTitle>
            <CardDescription>Pick a project and begin your interview preparation story.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to="/repositories">
                Prepare with my project
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {status === "anonymous" ? <ConnectGitHubPanel /> : null}

      <section className="grid gap-4 sm:grid-cols-2">
        {capabilities.map((capability) => (
          <Card key={capability.title}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <capability.icon className="size-4" />
                {capability.title}
              </CardTitle>
              <CardDescription>{capability.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </section>

      <HealthStatus />
    </div>
  );
}
