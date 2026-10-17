import { Plus } from "lucide-react";

import { lineRange } from "@/features/analysis/lib/blocks";
import type { FileBlock } from "@/features/analysis/types";
import { cn } from "@/lib/utils";

interface BlockAnnotationProps {
  block: FileBlock;
  accent: string;
  active: boolean;
  onOpen: () => void;
  onHoverChange: (hovering: boolean) => void;
}

/**
 * The short callout shown beside a block of code: a colour-coded dot, the
 * block's kind and line range, its symbol name, and a crisp one-line label.
 * Clicking it (or "More detail") reveals the full explanation.
 */
export function BlockAnnotation({ block, accent, active, onOpen, onHoverChange }: BlockAnnotationProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      onMouseEnter={() => onHoverChange(true)}
      onMouseLeave={() => onHoverChange(false)}
      onFocus={() => onHoverChange(true)}
      onBlur={() => onHoverChange(false)}
      className={cn(
        "group/note relative block w-full rounded-lg border bg-card p-3 text-left transition-all",
        active ? "shadow-sm" : "hover:border-foreground/20 hover:shadow-sm",
      )}
      style={active ? { borderColor: accent } : undefined}
    >
      {/* Arrow pointing back at the code it describes (side-by-side layout only). */}
      <span
        aria-hidden
        className="absolute top-4 -left-[7px] hidden size-3 rotate-45 rounded-[2px] border-b border-l bg-card lg:block"
        style={active ? { borderBottomColor: accent, borderLeftColor: accent } : undefined}
      />

      <span className="flex items-center gap-2">
        <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: accent }} />
        <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{block.kind}</span>
        <span className="ml-auto font-mono text-[10px] text-muted-foreground">{lineRange(block)}</span>
      </span>

      <span className="mt-1.5 block truncate font-mono text-xs font-medium" title={block.name}>
        {block.name}
      </span>

      <span className="mt-1 block text-xs leading-snug text-muted-foreground">{block.label}</span>

      <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors group-hover/note:text-foreground">
        <Plus className="size-3" />
        More detail
      </span>
    </button>
  );
}
