import { ArrowUpRight, FileCode2 } from "lucide-react";

import type { GraphNode } from "@/types/graph";

interface DependencyLinkCardProps {
  node: GraphNode;
  /** Selecting a file re-centres the view on it, so the graph can be walked. */
  onSelect: (path: string) => void;
}

export function DependencyLinkCard({ node, onSelect }: DependencyLinkCardProps) {
  return (
    <button
      type="button"
      title={node.id}
      onClick={() => onSelect(node.id)}
      className="group/dep flex w-full items-center gap-2 rounded-md border bg-background px-3 py-2 text-left transition hover:border-primary/40 hover:bg-accent focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none"
    >
      <FileCode2 className="size-4 shrink-0 text-muted-foreground" />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium">{node.label}</span>
        <span className="truncate text-xs text-muted-foreground">{node.id}</span>
      </span>
      <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition group-hover/dep:opacity-100" />
    </button>
  );
}
