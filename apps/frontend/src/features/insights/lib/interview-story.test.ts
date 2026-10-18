import { describe, expect, it } from "vitest";
import { buildInterviewStory } from "@/features/insights/lib/interview-story";
import type { ProjectInsights } from "@/features/insights/types";

const insights: ProjectInsights = {
  title: "App",
  summary: "A project",
  modules: [],
  startHere: [],
  flows: [],
  integrations: [],
  cached: true,
  limitedAnalysis: false,
};

describe("interview reading route", () => {
  it("starts at an entry file, follows imports through cycles, and includes disconnected files and assets once", () => {
    const paths = ["assets/logo.png", "src/config/index.ts", "README.md", "src/main.tsx", "src/App.tsx"];
    const result = buildInterviewStory(
      paths.map((path) => ({ path, type: "blob", size: 10 })),
      {
        nodes: paths.map((path) => ({ id: path, label: path })),
        edges: [
          { source: "src/main.tsx", target: "src/App.tsx" },
          { source: "src/App.tsx", target: "src/main.tsx" },
        ],
      },
      insights,
    );
    expect(result[0]?.path).toBe("src/main.tsx");
    expect(result[1]).toMatchObject({ path: "src/App.tsx", from: "src/main.tsx", readable: true });
    expect(new Set(result.map((stop) => stop.path)).size).toBe(paths.length);
    expect(result.find((stop) => stop.path === "assets/logo.png")?.readable).toBe(false);
  });
  it("keeps unsupported repositories navigable through the file tree", () => {
    expect(
      buildInterviewStory(
        [{ path: "app.py", type: "blob", size: 10 }],
        { nodes: [], edges: [] },
        { ...insights, limitedAnalysis: true },
      ),
    ).toMatchObject([{ path: "app.py", from: null, readable: true }]);
  });
});
