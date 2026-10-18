import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
  analysisFindFirst: vi.fn(),
  analysisCreate: vi.fn(),
  getConnectedRepository: vi.fn(),
  getFileContent: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    repositoryFile: { findMany: mocks.findMany },
    analysis: { findFirst: mocks.analysisFindFirst, create: mocks.analysisCreate },
  },
}));

vi.mock("@/modules/files/files.service", () => ({ getFileContent: mocks.getFileContent }));

vi.mock("@/modules/repositories/repositories.service", () => ({
  getConnectedRepository: mocks.getConnectedRepository,
}));

const { buildDependencyGraph } = await import("@/modules/graph/graph.service");

const FILE_CONTENTS: Record<string, string> = {
  "src/index.ts": 'import { add } from "./utils/math";\nimport express from "express";\n',
  "src/utils/math.ts": "export function add(a: number, b: number) {\n  return a + b;\n}\n",
};

describe("buildDependencyGraph", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.getConnectedRepository.mockResolvedValue({ id: "repo-1", defaultBranch: "main" });
    mocks.analysisFindFirst.mockResolvedValue(null);
    mocks.findMany.mockResolvedValue([
      { path: "README.md", type: "blob" },
      { path: "node_modules/dep/index.js", type: "blob" },
      { path: "src/index.ts", type: "blob" },
      { path: "src/utils/math.ts", type: "blob" },
    ]);
    mocks.getFileContent.mockImplementation((_user, _owner, _repo, path: string) =>
      Promise.resolve({
        path,
        sha: "sha",
        size: 10,
        content: FILE_CONTENTS[path] ?? "",
      }),
    );
  });

  it("resolves relative imports and records external packages", async () => {
    const graph = await buildDependencyGraph("user-1", "acme", "app", { limit: 50 });
    const nodeIds = graph.nodes.map((node) => node.id);

    expect(nodeIds).toContain("src/index.ts");
    expect(nodeIds).toContain("src/utils/math.ts");
    expect(nodeIds).toContain("npm:express");

    expect(graph.edges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ source: "src/index.ts", target: "src/utils/math.ts" }),
        expect.objectContaining({ source: "src/index.ts", target: "npm:express" }),
      ]),
    );
  });

  it("excludes non-source files and ignored directories", async () => {
    const graph = await buildDependencyGraph("user-1", "acme", "app", { limit: 50 });
    const nodeIds = graph.nodes.map((node) => node.id);

    expect(nodeIds).not.toContain("README.md");
    expect(nodeIds.some((id) => id.includes("node_modules"))).toBe(false);
  });

  it("assigns a stable id to every edge", async () => {
    const graph = await buildDependencyGraph("user-1", "acme", "app", { limit: 50 });

    expect(graph.edges.length).toBeGreaterThan(0);
    expect(graph.edges.every((edge) => typeof edge.id === "string" && edge.id.length > 0)).toBe(true);
  });

  it("persists the graph so it is not rebuilt from GitHub next time", async () => {
    await buildDependencyGraph("user-1", "acme", "app", { limit: 50 });

    expect(mocks.analysisCreate).toHaveBeenCalledOnce();
  });

  it("returns the cached graph without downloading any source", async () => {
    mocks.analysisFindFirst.mockResolvedValue({
      content: { nodes: [{ id: "src/index.ts", label: "index.ts" }], edges: [] },
    });

    const graph = await buildDependencyGraph("user-1", "acme", "app", { limit: 50 });

    expect(graph.nodes[0]?.id).toBe("src/index.ts");
    expect(mocks.getFileContent).not.toHaveBeenCalled();
    expect(mocks.analysisCreate).not.toHaveBeenCalled();
  });

  it("ignores the cache when a refresh is requested", async () => {
    mocks.analysisFindFirst.mockResolvedValue({ content: { nodes: [], edges: [] } });

    await buildDependencyGraph("user-1", "acme", "app", { limit: 50, refresh: true });

    expect(mocks.analysisFindFirst).not.toHaveBeenCalled();
    expect(mocks.getFileContent).toHaveBeenCalled();
  });

  it("keeps public preparation below the anonymous GitHub request limit", async () => {
    mocks.findMany.mockResolvedValue(
      Array.from({ length: 40 }, (_, index) => ({ path: `src/file-${index}.ts`, type: "blob" })),
    );

    await buildDependencyGraph("scribecode-public-repositories", "acme", "app", { limit: 60 });

    expect(mocks.getFileContent).toHaveBeenCalledTimes(24);
    expect(mocks.analysisCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ targetPath: "limit:24" }) }),
    );
  });

  it("does not cache a graph when GitHub rejects a source fetch", async () => {
    mocks.getFileContent.mockRejectedValue(new Error("rate limited"));

    await expect(buildDependencyGraph("user-1", "acme", "app", { limit: 50 })).rejects.toThrow("rate limited");
    expect(mocks.analysisCreate).not.toHaveBeenCalled();
  });
});
