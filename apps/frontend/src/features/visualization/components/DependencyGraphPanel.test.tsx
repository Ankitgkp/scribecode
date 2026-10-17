import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ArchitecturePanel } from "@/features/analysis/components/ArchitecturePanel";
import { DependencyGraphPanel } from "@/features/visualization/components/DependencyGraphPanel";
import type { Graph } from "@/types/graph";

const GRAPH: Graph = {
  nodes: [
    { id: "src/index.ts", label: "index.ts", group: "src" },
    { id: "src/app.ts", label: "app.ts", group: "src" },
    { id: "npm:express", label: "express", group: "external" },
  ],
  edges: [
    { id: "e1", source: "src/index.ts", target: "src/app.ts" },
    { id: "e2", source: "src/index.ts", target: "npm:express", label: "depends on" },
    { id: "e3", source: "src/app.ts", target: "src/index.ts" },
  ],
};

describe("DependencyGraphPanel", () => {
  it("focuses on the selected file and groups its relationships", () => {
    render(
      <DependencyGraphPanel
        graph={GRAPH}
        status="success"
        error={null}
        selectedPath="src/index.ts"
        onSelectFile={vi.fn()}
        onRefresh={vi.fn()}
      />,
    );

    expect(screen.getByRole("heading", { name: "Imports" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "Imported by" })).toBeDefined();
    expect(screen.getByText("express")).toBeDefined();
    // `app.ts` also appears in the "most connected files" list, so match loosely.
    expect(screen.getAllByText("app.ts").length).toBeGreaterThan(0);
  });

  it("asks for a file when none is selected", () => {
    render(
      <DependencyGraphPanel
        graph={GRAPH}
        status="success"
        error={null}
        selectedPath=""
        onSelectFile={vi.fn()}
        onRefresh={vi.fn()}
      />,
    );

    expect(screen.getByText("Select a file in the tree to see what it depends on.")).toBeDefined();
  });

  it("walks the graph when a dependency is clicked", () => {
    const onSelectFile = vi.fn();

    render(
      <DependencyGraphPanel
        graph={GRAPH}
        status="success"
        error={null}
        selectedPath="src/index.ts"
        onSelectFile={onSelectFile}
        onRefresh={vi.fn()}
      />,
    );

    fireEvent.click(screen.getAllByText("app.ts")[0] as HTMLElement);

    expect(onSelectFile).toHaveBeenCalledWith("src/app.ts");
  });
});

describe("ArchitecturePanel", () => {
  it("renders modules as cards with their connections", () => {
    render(
      <ArchitecturePanel
        analysis={{
          title: "Application architecture",
          overview: "Modules grouped by top-level directory.",
          cached: false,
          graph: {
            nodes: [
              { id: "dir:src", label: "src", group: "module" },
              { id: "dir:lib", label: "lib", group: "module", description: "Shared helpers" },
            ],
            edges: [{ id: "a1", source: "dir:src", target: "dir:lib" }],
          },
        }}
        status="success"
        error={null}
        onRegenerate={vi.fn()}
      />,
    );

    expect(screen.getByRole("heading", { name: "Module" })).toBeDefined();
    expect(screen.getByText("Shared helpers")).toBeDefined();
    expect(screen.getByText("→ lib")).toBeDefined();
  });
});
