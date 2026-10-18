import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  analysisFindFirst: vi.fn(),
  analysisCreate: vi.fn(),
  getConnectedRepository: vi.fn(),
  listFileTree: vi.fn(),
  generateStructured: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: { analysis: { findFirst: mocks.analysisFindFirst, create: mocks.analysisCreate } },
}));
vi.mock("@/lib/llm", () => ({ llm: { model: "mock", generateStructured: mocks.generateStructured } }));
vi.mock("@/modules/files/files.service", () => ({ listFileTree: mocks.listFileTree }));
vi.mock("@/modules/repositories/repositories.service", () => ({
  getConnectedRepository: mocks.getConnectedRepository,
}));

const { analyzeProjectInsights } = await import("@/modules/analysis/project-insights.service");

const graph = {
  nodes: [{ id: "src/app.tsx", label: "app.tsx", group: "src" }],
  edges: [],
};

describe("analyzeProjectInsights", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getConnectedRepository.mockResolvedValue({ id: "repo-1" });
    mocks.listFileTree.mockResolvedValue([{ path: "src/app.tsx", type: "blob", size: 10 }]);
  });

  it("reuses a cached tour without calling the model", async () => {
    mocks.analysisFindFirst.mockResolvedValue({
      content: { title: "Cached", summary: "Already mapped.", startHere: [], modules: [], flows: [], integrations: [] },
    });

    const result = await analyzeProjectInsights("user-1", "acme", "app", graph, { refresh: false });

    expect(result).toMatchObject({ title: "Cached", cached: true, limitedAnalysis: false });
    expect(mocks.generateStructured).not.toHaveBeenCalled();
  });

  it("filters unknown file paths and persists a structured tour", async () => {
    mocks.analysisFindFirst.mockResolvedValue(null);
    mocks.generateStructured.mockResolvedValue({
      title: " A starter app ",
      summary: " A small interface. ",
      startHere: [
        { path: "src/app.tsx", label: "App", reason: "Entry point" },
        { path: "missing.ts", label: "Missing", reason: "Nope" },
      ],
      modules: [
        {
          id: "ui",
          name: " UI ",
          kind: "interface",
          purpose: " Screens ",
          paths: ["src/app.tsx", "missing.ts"],
          connectsTo: ["data"],
        },
        { id: "data", name: "Data", kind: "data", purpose: "State", paths: [], connectsTo: [] },
      ],
      flows: [{ id: "open", name: " Open ", description: " Start ", steps: ["Open", "Render"] }],
      integrations: [" React ", "React", ""],
    });

    const result = await analyzeProjectInsights("user-1", "acme", "app", graph, { refresh: false });

    expect(result.cached).toBe(false);
    expect(result.startHere).toHaveLength(1);
    expect(result.modules[0]).toMatchObject({ name: "UI", paths: ["src/app.tsx"], connectsTo: ["data"] });
    expect(result.integrations).toEqual(["React"]);
    expect(mocks.analysisCreate).toHaveBeenCalledOnce();
  });

  it("marks an empty parsed graph as limited analysis", async () => {
    mocks.analysisFindFirst.mockResolvedValue({
      content: { title: "Tour", summary: "Structure only.", startHere: [], modules: [], flows: [], integrations: [] },
    });

    const result = await analyzeProjectInsights("user-1", "acme", "app", { nodes: [], edges: [] }, { refresh: false });

    expect(result.limitedAnalysis).toBe(true);
  });
});
