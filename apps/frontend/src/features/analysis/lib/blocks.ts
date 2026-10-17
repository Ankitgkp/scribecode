import type { FileBlock } from "@/features/analysis/types";

/** A run of consecutive file lines, optionally explained by a block. */
export interface CodeSegment {
  /** Stable key for React lists. */
  id: string;
  /** 1-based line number of the first line in the segment. */
  startLine: number;
  lines: string[];
  /** The block describing this segment, or null for unexplained context. */
  block: FileBlock | null;
}

/** Stable identity for a block, independent of object identity. */
export function blockKey(block: FileBlock): string {
  return `${block.startLine}-${block.endLine}-${block.name}`;
}

/** Human-readable line range, e.g. `L12` or `L12–24`. */
export function lineRange(block: Pick<FileBlock, "startLine" | "endLine">): string {
  return block.startLine === block.endLine ? `L${block.startLine}` : `L${block.startLine}–${block.endLine}`;
}

/** Splits source into lines, normalizing line endings and the trailing newline. */
export function splitLines(content: string): string[] {
  const lines = content.replace(/\r\n?/g, "\n").split("\n");

  if (lines.length > 1 && lines[lines.length - 1] === "") {
    return lines.slice(0, -1);
  }

  return lines;
}

/**
 * Interleaves a file's lines with the AI's blocks so the UI can render each
 * block beside the exact code it describes. Unexplained stretches become
 * context segments. Defensive about out-of-range/overlapping ranges (the
 * backend already normalizes, but the client should never crash or mis-render).
 */
export function buildSegments(lines: string[], blocks: FileBlock[]): CodeSegment[] {
  const segments: CodeSegment[] = [];
  let cursor = 0;

  for (const block of blocks) {
    const start = Math.max(block.startLine - 1, 0);

    if (start >= lines.length || start < cursor) {
      continue;
    }

    if (start > cursor) {
      segments.push({
        id: `lines-${cursor}`,
        startLine: cursor + 1,
        lines: lines.slice(cursor, start),
        block: null,
      });
    }

    const end = Math.min(Math.max(block.endLine, block.startLine), lines.length);
    segments.push({
      id: `block-${blockKey(block)}`,
      startLine: block.startLine,
      lines: lines.slice(start, end),
      block,
    });
    cursor = end;
  }

  if (cursor < lines.length) {
    segments.push({ id: `lines-${cursor}`, startLine: cursor + 1, lines: lines.slice(cursor), block: null });
  }

  return segments;
}
