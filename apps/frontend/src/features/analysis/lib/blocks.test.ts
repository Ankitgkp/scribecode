import { describe, expect, it } from "vitest";

import { buildSegments, lineRange, splitLines } from "@/features/analysis/lib/blocks";
import type { FileBlock } from "@/features/analysis/types";

const lines = Array.from({ length: 10 }, (_, index) => `line ${index + 1}`);

function block(overrides: Partial<FileBlock>): FileBlock {
  return { name: "f", kind: "function", startLine: 1, endLine: 1, label: "Does f", detail: "Details", ...overrides };
}

describe("splitLines", () => {
  it("normalizes CRLF and drops the trailing newline", () => {
    expect(splitLines("a\r\nb\n")).toEqual(["a", "b"]);
  });

  it("keeps blank interior lines", () => {
    expect(splitLines("a\n\nb")).toEqual(["a", "", "b"]);
  });
});

describe("lineRange", () => {
  it("renders a single line and a span", () => {
    expect(lineRange({ startLine: 4, endLine: 4 })).toBe("L4");
    expect(lineRange({ startLine: 4, endLine: 9 })).toBe("L4–9");
  });
});

describe("buildSegments", () => {
  it("wraps a block in leading and trailing context segments", () => {
    const segments = buildSegments(lines, [block({ name: "f", startLine: 3, endLine: 5 })]);

    expect(segments.map((segment) => [segment.startLine, segment.block?.name ?? null])).toEqual([
      [1, null],
      [3, "f"],
      [6, null],
    ]);
    expect(segments[1]?.lines).toEqual(["line 3", "line 4", "line 5"]);
  });

  it("ignores blocks that overlap an earlier block", () => {
    const segments = buildSegments(lines, [
      block({ name: "a", startLine: 1, endLine: 4 }),
      block({ name: "b", startLine: 3, endLine: 6 }),
    ]);

    expect(segments.filter((segment) => segment.block).map((segment) => segment.block?.name)).toEqual(["a"]);
  });

  it("ignores blocks entirely past the end of the file", () => {
    const segments = buildSegments(lines, [block({ startLine: 50, endLine: 60 })]);

    expect(segments).toHaveLength(1);
    expect(segments[0]?.block).toBeNull();
  });

  it("clamps a block that runs past the end of the file", () => {
    const segments = buildSegments(lines, [block({ name: "tail", startLine: 9, endLine: 40 })]);
    const tail = segments.find((segment) => segment.block);

    expect(tail?.lines).toEqual(["line 9", "line 10"]);
  });
});
