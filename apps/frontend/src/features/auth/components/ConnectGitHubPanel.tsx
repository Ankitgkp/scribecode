import { useState, type FormEvent } from "react";
import { GitBranch, KeyRound, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { githubOAuthUrl } from "@/features/auth/api";
import { useSession } from "@/features/auth/session-context";

export function ConnectGitHubPanel() {
  const { connectWithToken } = useSession();
  const [token, setToken] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await connectWithToken(token.trim());
      setToken("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not connect to GitHub");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitBranch className="size-4" />
          Connect GitHub
        </CardTitle>
        <CardDescription>Grant read access to the repositories you want to explore.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <Button asChild>
          <a href={githubOAuthUrl()}>
            <GitBranch className="size-4" />
            Continue with GitHub
          </a>
        </Button>

        <div className="flex items-center gap-3 text-xs uppercase text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          or
          <span className="h-px flex-1 bg-border" />
        </div>

        <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
          <Label htmlFor="github-token">Personal access token</Label>
          <Input
            id="github-token"
            type="password"
            placeholder="ghp_…"
            autoComplete="off"
            value={token}
            onChange={(event) => setToken(event.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Create a token with <code className="font-mono">repo</code> and <code className="font-mono">read:user</code>{" "}
            scopes. Handy for local development when OAuth is not configured.
          </p>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" variant="secondary" disabled={submitting || token.trim().length === 0}>
            {submitting ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
            Connect with token
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
