import { ArrowRight, FileCode, FolderTree, Network, Waypoints } from "lucide-react";
import { Link, useSearchParams } from "react-router";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";
import { APP_NAME, APP_TAGLINE } from "@/config/app";
import { ConnectGitHubPanel } from "@/features/auth/components/ConnectGitHubPanel";
import { useSession } from "@/features/auth/session-context";
import { HealthStatus } from "@/features/health/components/HealthStatus";

const capabilities = [
  {
    icon: FolderTree,
    title: "Browse the file tree",
    description: "Open any GitHub repository and move through its structure without cloning it.",
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
      <PageHeader title={APP_NAME} description={APP_TAGLINE} />

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
            <CardDescription>Pick a repository to start exploring.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to="/repositories">
                Go to repositories
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
