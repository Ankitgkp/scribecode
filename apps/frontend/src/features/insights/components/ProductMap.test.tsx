import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ProductMap } from "@/features/insights/components/ProductMap";
import { ProjectTour } from "@/features/insights/components/ProjectTour";
import type { ProjectInsights } from "@/features/insights/types";
import type { Graph } from "@/types/graph";

const insights: ProjectInsights = {
  title: "Project tour",
  summary: "A small app.",
  cached: false,
  limitedAnalysis: false,
  startHere: [{ path: "src/app.tsx", label: "App", reason: "It starts the interface." }],
  modules: [
    {
      id: "ui",
      name: "Interface",
      kind: "interface",
      purpose: "Shows screens.",
      paths: ["src/app.tsx"],
      connectsTo: ["data"],
    },
    { id: "data", name: "Data", kind: "data", purpose: "Stores state.", paths: [], connectsTo: [] },
  ],
  flows: [{ id: "launch", name: "Open app", description: "The startup path.", steps: ["Open", "Render"] }],
  integrations: ["React"],
};

const graph: Graph = {
  nodes: [
    { id: "src/app.tsx", label: "app.tsx" },
    { id: "src/lib.ts", label: "lib.ts" },
    { id: "src/page.tsx", label: "page.tsx" },
    { id: "npm:react", label: "react", group: "external" },
  ],
  edges: [
    { source: "src/app.tsx", target: "src/lib.ts" },
    { source: "src/page.tsx", target: "src/app.tsx" },
    { source: "src/app.tsx", target: "npm:react" },
  ],
};

describe("guided repository views", () => {
  it("links a start-here file to the explorer", () => {
    const onSelectFile = vi.fn();
    render(
      <ProjectTour insights={insights} status="success" error={null} onSelectFile={onSelectFile} onShowMap={vi.fn()} />,
    );

    fireEvent.click(screen.getByRole("button", { name: /app/i }));
    expect(onSelectFile).toHaveBeenCalledWith("src/app.tsx");
  });

  it("focuses real file connections and opens the selected file", () => {
    const onSelectFile = vi.fn();
    render(<ProductMap insights={insights} graph={graph} status="success" error={null} onSelectFile={onSelectFile} />);

    expect(screen.getByText("One file. The whole context.")).toBeDefined();
    expect(screen.getByText("Used by")).toBeDefined();
    expect(screen.getByText("Uses")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Focus src/lib.ts" }));
    expect(screen.getByText("src/lib.ts")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: /explain this file/i }));
    expect(onSelectFile).toHaveBeenCalledWith("src/lib.ts");
  });

  it("reveals selected feature areas without a full graph canvas", () => {
    render(<ProductMap insights={insights} graph={graph} status="success" error={null} onSelectFile={vi.fn()} />);

    fireEvent.click(screen.getByRole("tab", { name: "Feature areas" }));
    fireEvent.click(screen.getByRole("button", { name: "Show Data details" }));
    expect(within(screen.getByRole("complementary")).getByText("Stores state.")).toBeDefined();
    expect(screen.queryByText("One file. The whole context.")).toBeNull();
  });
});
