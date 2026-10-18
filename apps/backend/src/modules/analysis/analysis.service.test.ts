import { beforeEach, describe, expect, it, vi } from "vitest";

import type { FileBlock } from "@/modules/analysis/analysis.schema";

const mocks = vi.hoisted(() => ({
  analysisFindFirst: vi.fn(),
  analysisCreate: vi.fn(),
  repositoryFileFindUnique: vi.fn(),
  getConnectedRepository: vi.fn(),
  getFileContent: vi.fn(),
  listFileTree: vi.fn(),
  generateStructured: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    analysis: { findFirst: mocks.analysisFindFirst, create: mocks.analysisCreate },
    repositoryFile: { findUnique: mocks.repositoryFileFindUnique },
  },
}));

vi.mock("@/lib/llm", () => ({
  llm: {
    name: "mock",
    model: "mock",
    isConfigured: true,
    generateText: vi.fn(),
    generateStructured: mocks.generateStructured,
  },
}));

vi.mock("@/modules/files/files.service", () => ({
  getFileContent: mocks.getFileContent,
  listFileTree: mocks.listFileTree,
}));

vi.mock("@/modules/repositories/repositories.service", () => ({
  getConnectedRepository: mocks.getConnectedRepository,
}));

const { analyzeFile, analyzeArchitecture, normalizeBlocks } = await import("@/modules/analysis/analysis.service");

function block(overrides: Partial<FileBlock>): FileBlock {
  return {
    name: "foo",
    kind: "function",
    startLine: 1,
    endLine: 2,
    label: "Does foo",
    detail: "Explains foo in detail.",
    ...overrides,
  };
}

describe("normalizeBlocks", () => {
  it("clamps line ranges to the file and sorts blocks by position", () => {
    const result = normalizeBlocks(
      [block({ name: "late", startLine: 30, endLine: 50 }), block({ name: "early", startLine: 2, endLine: 9 })],
      20,
    );

    expect(result.map((entry) => entry.name)).toEqual(["early", "late"]);
    expect(result[1]).toMatchObject({ startLine: 20, endLine: 20 });
  });

  it("drops blocks that overlap an earlier block", () => {
    const result = normalizeBlocks(
      [
        block({ name: "a", startLine: 1, endLine: 10 }),
        block({ name: "b", startLine: 5, endLine: 8 }),
        block({ name: "c", startLine: 11, endLine: 15 }),
      ],
      20,
    );

    expect(result.map((entry) => entry.name)).toEqual(["a", "c"]);
  });

  it("drops unnamed blocks and falls back to a line-range label", () => {
    const result = normalizeBlocks(
      [block({ name: "   " }), block({ name: "x", startLine: 5, endLine: 6, label: "", detail: "" })],
      20,
    );

    expect(result).toHaveLength(1);
    expect(result[0]?.kind).toBe("function");
    expect(result[0]?.label).toBe("Lines 5–6");
    expect(result[0]?.detail).toBe("Lines 5–6");
  });

  it("caps the number of blocks", () => {
    const many = Array.from({ length: 30 }, (_, index) =>
      block({ name: `f${index}`, startLine: index * 2 + 1, endLine: index * 2 + 2 }),
    );

    expect(normalizeBlocks(many, 100)).toHaveLength(12);
  });

  it("returns nothing for an empty file", () => {
    expect(normalizeBlocks([block({})], 0)).toEqual([]);
  });
});

describe("analysis service", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.getConnectedRepository.mockResolvedValue({ id: "repo-1", defaultBranch: "main" });
    mocks.repositoryFileFindUnique.mockResolvedValue({ sha: "tree-sha" });
    mocks.getFileContent.mockResolvedValue({
      path: "src/index.ts",
      sha: "sha",
      size: 10,
      content: "export const value = 1;",
      truncated: false,
    });
    mocks.listFileTree.mockResolvedValue([
      { path: "src/index.ts", type: "blob", size: 10 },
      { path: "src/lib/util.ts", type: "blob", size: 10 },
    ]);
  });

  it("returns a cached file analysis without calling the model", async () => {
    const cached = { purpose: "Cached purpose", highlights: [], blocks: [], dependencies: [] };
    mocks.analysisFindFirst.mockResolvedValue({ content: cached });

    const result = await analyzeFile("user-1", "acme", "app", "src/index.ts", { refresh: false });

    expect(result).toMatchObject({ purpose: "Cached purpose", cached: true });
    expect(mocks.generateStructured).not.toHaveBeenCalled();
    expect(mocks.getFileContent).not.toHaveBeenCalled();
  });

  it("generates, normalizes and persists a file analysis", async () => {
    mocks.analysisFindFirst.mockResolvedValue(null);
    mocks.generateStructured.mockResolvedValue({
      purpose: "  A tiny module.  ",
      highlights: ["One thing", "  "],
      dependencies: ["zod"],
      blocks: [block({ name: "value", startLine: 1, endLine: 1 })],
    });

    const result = await analyzeFile("user-1", "acme", "app", "src/index.ts", { refresh: false });

    expect(result.cached).toBe(false);
    expect(result.purpose).toBe("A tiny module.");
    expect(result.highlights).toEqual(["One thing"]);
    expect(result.blocks).toHaveLength(1);
    expect(mocks.analysisCreate).toHaveBeenCalledOnce();
    expect(mocks.analysisCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ targetPath: "src/index.ts@tree-sha" }) }),
    );
  });

  it("shares an in-flight file explanation between interview and graph views", async () => {
    mocks.analysisFindFirst.mockResolvedValue(null);
    mocks.generateStructured.mockResolvedValue({
      purpose: "Starts the app.",
      highlights: [],
      blocks: [],
      dependencies: [],
    });
    await Promise.all([
      analyzeFile("user-1", "acme", "app", "src/index.ts", { refresh: false }),
      analyzeFile("user-1", "acme", "app", "src/index.ts", { refresh: false }),
    ]);
    expect(mocks.generateStructured).toHaveBeenCalledOnce();
  });

  it("normalizes architecture edges into a graph with stable ids", async () => {
    mocks.analysisFindFirst.mockResolvedValue(null);
    mocks.generateStructured.mockResolvedValue({
      title: "Architecture",
      overview: "Two modules.",
      graph: {
        nodes: [
          { id: "a", label: "A" },
          { id: "b", label: "B" },
        ],
        edges: [{ source: "a", target: "b" }],
      },
    });

    const result = await analyzeArchitecture("user-1", "acme", "app", { refresh: false });

    expect(result.graph.edges[0]?.id).toBe("a->b:0");
    expect(mocks.analysisCreate).toHaveBeenCalledOnce();
  });
});
