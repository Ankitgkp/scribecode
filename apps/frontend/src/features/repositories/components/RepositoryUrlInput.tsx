import { useState, type FormEvent } from "react";
import { ArrowUpRight, GitBranch, LoaderCircle } from "lucide-react";
import { useNavigate } from "react-router";

import { openRepository } from "@/features/repositories/api";
import { parseGitHubRepository } from "@/features/repositories/lib/parseGitHubRepository";
import { clearAsyncResourceCache } from "@/hooks/useAsyncResource";
import { cn } from "@/lib/utils";

export function RepositoryUrlInput({ variant = "page" }: { variant?: "hero" | "page" }) {
  const [value, setValue] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const hero = variant === "hero";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = parseGitHubRepository(value);
    if (!parsed) {
      setError("Paste a GitHub repository URL, such as github.com/owner/repo.");
      return;
    }

    setPending(true);
    setError(null);
    try {
      const repository = await openRepository(parsed);
      clearAsyncResourceCache();
      await navigate(`/repositories/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.name)}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not open this repository. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={(event) => void submit(event)} className={cn("w-full max-w-2xl", hero && "lg:justify-self-end")}>
      <label htmlFor={hero ? "hero-repository-url" : "page-repository-url"} className={cn("mb-3 block text-xs font-medium uppercase tracking-[.2em]", hero ? "text-white/65" : "text-muted-foreground")}>
        {hero ? "Or paste a public repo" : "Open any public GitHub repository"}
      </label>
      <div className={cn(
        "group flex min-w-0 items-center gap-2 rounded-lg border p-1 transition-colors focus-within:ring-2 focus-within:ring-[#a6d676]",
        hero ? "border-white/35 bg-black/30 text-white backdrop-blur-sm focus-within:border-[#c8f39a]" : "border-border bg-card text-foreground dark:bg-[#1b211c]",
      )}>
        {!hero ? <GitBranch className="ml-3 size-5 shrink-0 text-muted-foreground" aria-hidden="true" /> : null}
        <input
          id={hero ? "hero-repository-url" : "page-repository-url"}
          type="text"
          inputMode="url"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          value={value}
          onChange={(event) => { setValue(event.target.value); if (error) setError(null); }}
          placeholder={hero ? "github.com/owner/repo" : "github.com/owner/repository"}
          className={cn("h-11 min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-current/40", hero && "text-white")}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${variant}-repository-error` : undefined}
        />
        <button
          type="submit"
          disabled={pending}
          className={cn("inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-md bg-[#d8f596] px-4 text-sm font-semibold text-[#1b2b1e] transition-colors hover:bg-[#ecffbf] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c8f39a] disabled:cursor-wait disabled:opacity-60", !hero && "sm:px-5")}
        >
          {pending ? <LoaderCircle className="size-4 animate-spin" /> : <ArrowUpRight className="size-4" />}
          <span>{pending ? "Opening…" : "Explore"}</span>
        </button>
      </div>
      {error ? <p id={`${variant}-repository-error`} role="alert" className={cn("mt-3 text-sm", hero ? "text-red-200" : "text-destructive")}>{error}</p> : null}
    </form>
  );
}
