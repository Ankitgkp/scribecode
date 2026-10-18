/*
MIT License

Copyright (c) 2026 Bidyut Kundu

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
import { ArrowUpRight, GitBranch } from "lucide-react";
import { Link } from "react-router";

import { cn } from "@/lib/utils";

const languageColors: Record<string, string> = {
  TypeScript: "bg-[#3178c6]",
  JavaScript: "bg-[#f1e05a]",
  Python: "bg-[#3572a5]",
  Go: "bg-[#00add8]",
  Rust: "bg-[#dea584]",
  Java: "bg-[#b07219]",
  HTML: "bg-[#e34c26]",
  CSS: "bg-[#563d7c]",
  Ruby: "bg-[#701516]",
};

type GitHubRepoCardProps = {
  owner: string;
  name: string;
  description: string | null;
  language: string | null;
  defaultBranch: string;
  isPrivate: boolean;
  href: string;
  className?: string;
};

function GitHubMark() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-5 shrink-0" aria-hidden="true">
      <path d="M12 .75a11.25 11.25 0 0 0-3.56 21.92c.56.1.77-.24.77-.54v-2.08c-3.14.68-3.8-1.33-3.8-1.33-.51-1.3-1.25-1.65-1.25-1.65-1.02-.7.08-.69.08-.69 1.13.08 1.72 1.16 1.72 1.16 1 .1.78.42 1.38.7 1.75.22-.77.39-1.3.72-1.6-2.5-.28-5.13-1.25-5.13-5.56 0-1.23.44-2.24 1.16-3.03-.12-.28-.5-1.43.11-2.99 0 0 .95-.3 3.1 1.16a10.8 10.8 0 0 1 5.64 0c2.15-1.46 3.1-1.16 3.1-1.16.61 1.56.23 2.71.11 2.99.72.79 1.16 1.8 1.16 3.03 0 4.32-2.64 5.27-5.15 5.55.4.35.77 1.02.77 2.06v3.05c0 .3.2.65.78.54A11.25 11.25 0 0 0 12 .75Z" />
    </svg>
  );
}

export function GitHubRepoCard({
  owner,
  name,
  description,
  language,
  defaultBranch,
  isPrivate,
  href,
  className,
}: GitHubRepoCardProps) {
  return (
    <Link
      to={href}
      data-slot="github-repo-card"
      className={cn(
        "group flex w-72 min-h-36 flex-col rounded-xl border border-neutral-200 bg-white p-4 font-sans text-neutral-900 shadow-[0_2px_0_rgba(255,255,255,.12),0_12px_30px_rgba(0,0,0,.12)] transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_2px_0_rgba(255,255,255,.12),0_16px_36px_rgba(0,0,0,.22)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c8f39a] focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className,
      )}
      aria-label={`Explore ${owner}/${name}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <GitHubMark />
          <span className="truncate text-[13px] font-semibold">
            {owner}
            <span className="px-1 text-neutral-400">/</span>
            {name}
          </span>
        </div>
        <span className="shrink-0 rounded-full border border-neutral-200 px-2 py-0.5 text-[10px] font-medium text-neutral-500">
          {isPrivate ? "Private" : "Public"}
        </span>
      </div>

      <p className="mt-3 mb-4 line-clamp-2 min-h-9 text-xs leading-relaxed text-neutral-600">
        {description || "No description provided."}
      </p>

      <div className="mt-auto flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3 text-[11px] text-neutral-500">
          {language ? (
            <span className="inline-flex min-w-0 items-center gap-1.5 truncate">
              <span className={cn("size-2.5 shrink-0 rounded-full", languageColors[language] ?? "bg-neutral-400")} />
              <span className="truncate">{language}</span>
            </span>
          ) : null}
          <span className="inline-flex min-w-0 items-center gap-1 truncate">
            <GitBranch className="size-3 shrink-0" aria-hidden="true" />
            <span className="truncate">{defaultBranch}</span>
          </span>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-neutral-50 px-2.5 py-1.5 text-[11px] font-semibold text-neutral-700 transition-colors group-hover:bg-neutral-100">
          Explore <ArrowUpRight className="size-3" aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}
