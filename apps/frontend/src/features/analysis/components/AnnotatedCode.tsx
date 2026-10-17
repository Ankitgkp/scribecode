import { useMemo, useState } from "react";

import { BlockAnnotation } from "@/features/analysis/components/BlockAnnotation";
import { CodeLines } from "@/features/analysis/components/CodeLines";
import { accentTint, accentFor } from "@/features/analysis/lib/accents";
import { blockKey, buildSegments, splitLines } from "@/features/analysis/lib/blocks";
import type { FileBlock } from "@/features/analysis/types";
import { cn } from "@/lib/utils";

interface AnnotatedCodeProps {
  content: string;
  blocks: FileBlock[];
  activeKey: string | null;
  onOpen: (block: FileBlock) => void;
}

/**
 * The core "show me how this file works" surface: the source split into
 * segments, where each explained block renders beside a short, colour-coded
 * callout with an arrow pointing back at its code. Unexplained runs (imports,
 * boilerplate) become quiet context rows. Hovering a callout lights up its code.
 */
export function AnnotatedCode({ content, blocks, activeKey, onOpen }: AnnotatedCodeProps) {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const segments = useMemo(() => buildSegments(splitLines(content), blocks), [content, blocks]);

  const accents = useMemo(() => {
    const map = new Map<string, string>();
    blocks.forEach((block, index) => map.set(blockKey(block), accentFor(index)));
    return map;
  }, [blocks]);

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      {segments.map((segment) => {
        const block = segment.block;
        const key = block ? blockKey(block) : null;
        const accent = key ? (accents.get(key) ?? accentFor(0)) : null;
        const highlighted = key !== null && (key === activeKey || key === hoveredKey);

        return (
          <div key={segment.id} className="grid border-b last:border-b-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,290px)]">
            <div
              id={key ? `code-${key}` : undefined}
              className={cn("min-w-0 transition-colors", block && "border-l-[3px]")}
              style={
                block && accent
                  ? { borderLeftColor: accent, backgroundColor: accentTint(accent, highlighted ? 14 : 6) }
                  : undefined
              }
            >
              <CodeLines startLine={segment.startLine} lines={segment.lines} />
            </div>

            <div className="border-t px-3 py-3 lg:border-t-0 lg:border-l">
              {block && accent ? (
                <BlockAnnotation
                  block={block}
                  accent={accent}
                  active={key === activeKey}
                  onOpen={() => onOpen(block)}
                  onHoverChange={(hovering) => setHoveredKey(hovering ? key : null)}
                />
              ) : (
                <p className="hidden text-[10px] uppercase tracking-wide text-muted-foreground/40 lg:block">
                  {segment.lines.length} {segment.lines.length === 1 ? "line" : "lines"}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
