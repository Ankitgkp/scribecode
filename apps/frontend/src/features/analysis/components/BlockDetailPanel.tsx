import { RefreshCw, X } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { CodeLines } from "@/features/analysis/components/CodeLines";
import { lineRange } from "@/features/analysis/lib/blocks";
import type { FileBlock } from "@/features/analysis/types";
import { cn } from "@/lib/utils";

interface BlockDetailPanelProps {
  block: FileBlock | null;
  accent: string;
  /** The block's own source lines. */
  code: string[];
  cached: boolean;
  regenerating: boolean;
  onClose: () => void;
  onRegenerate: () => void;
}

/**
 * Slide-over with the full explanation for a single block: the complete detail
 * text plus the exact code it refers to. Opened from a block's "More detail".
 */
export function BlockDetailPanel({
  block,
  accent,
  code,
  cached,
  regenerating,
  onClose,
  onRegenerate,
}: BlockDetailPanelProps) {
  const open = block !== null;

  useEffect(() => {
    if (!open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!block) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Close details"
        onClick={onClose}
        className="absolute inset-0 animate-in fade-in bg-background/70 backdrop-blur-sm duration-200"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`${block.name} explanation`}
        className="relative flex h-full w-full max-w-2xl animate-in flex-col border-l bg-card shadow-2xl duration-200 slide-in-from-right"
      >
        <header className="flex items-start gap-3 border-b px-5 py-4">
          <span className="mt-1.5 size-2.5 shrink-0 rounded-full" style={{ backgroundColor: accent }} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              <span>{block.kind}</span>
              <span className="font-mono normal-case">{lineRange(block)}</span>
            </div>
            <h2 className="truncate font-mono text-base font-semibold">{block.name}</h2>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close">
            <X />
          </Button>
        </header>

        <div className="flex-1 overflow-auto px-5 py-4">
          <p className="text-sm font-medium">{block.label}</p>
          <p className="mt-3 text-sm leading-relaxed whitespace-pre-line text-muted-foreground">{block.detail}</p>

          <h3 className="mt-6 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Code</h3>
          <div className="mt-2 overflow-hidden rounded-lg border bg-muted/30">
            <CodeLines startLine={block.startLine} lines={code} />
          </div>
        </div>

        <footer className="flex items-center justify-between gap-3 border-t px-5 py-3">
          <span className="text-[11px] text-muted-foreground">{cached ? "Cached analysis" : "Fresh analysis"}</span>
          <Button variant="outline" size="sm" onClick={onRegenerate} disabled={regenerating}>
            <RefreshCw className={cn("size-3.5", regenerating && "animate-spin")} />
            Regenerate
          </Button>
        </footer>
      </aside>
    </div>
  );
}
