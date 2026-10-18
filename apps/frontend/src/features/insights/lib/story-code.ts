import type { FileBlock } from "@/features/analysis/types";

export function storyCodeExcerpt(content: string, blocks: FileBlock[], selected: number | null) {
  const lines = content.replace(/\r\n?/g, "\n").split("\n");
  const defaultIndex = blocks.findIndex((block) =>
    ["component", "hook", "route", "function", "class"].includes(block.kind),
  );
  const index = selected ?? Math.max(0, defaultIndex);
  const block = blocks[index];
  const start = block ? Math.min(lines.length, Math.max(1, block.startLine)) : 1;
  const end = Math.min(lines.length, start + 9, block?.endLine ?? lines.length);
  return {
    block,
    index,
    start,
    end,
    lines: lines.slice(start - 1, end).map((text, offset) => ({ number: start + offset, text })),
  };
}
