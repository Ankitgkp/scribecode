import { describe, expect, it } from "vitest";

import { directory, fileName, hubs, isExternalNode, neighborhood } from "@/features/visualization/lib/graph";
import type { Graph } from "@/types/graph";

const GRAPH: Graph = {
  nodes: [
    { id: "src/index.ts", label: "index.ts", group: "src" },
    { id: "src/app.ts", label: "app.ts", group: "src" },
    { id: "src/utils/math.ts", label: "math.ts", group: "src" },
    { id: "npm:express", label: "express", group: "external" },
  ],
  edges: [
    { source: "src/index.ts", target: "src/app.ts", label: "imports" },
    { source: "src/index.ts", target: "src/utils/math.ts", label: "imports" },
    { source: "src/app.ts", target: "src/utils/math.ts", label: "imports" },
    { source: "src/app.ts", target: "npm:express", label: "depends on" },
  ],
};

describe("neighborhood", () => {
  it("splits internal imports, importers and packages", () => {
    const view = neighborhood(GRAPH, "src/index.ts");

    expect(view.imports.map((node) => node.id)).toEqual(["src/app.ts", "src/utils/math.ts"]);
    expect(view.importedBy).toEqual([]);
    expect(view.packages).toEqual([]);
  });

  it("collects importers and package usage", () => {
    const view = neighborhood(GRAPH, "src/utils/math.ts");

    expect(view.imports).toEqual([]);
    expect(view.importedBy.map((node) => node.id)).toEqual(["src/app.ts", "src/index.ts"]);
    expect(view.packages).toEqual([]);
  });

  it("reports packages separately from files", () => {
    const view = neighborhood(GRAPH, "src/app.ts");

    expect(view.imports.map((node) => node.id)).toEqual(["src/utils/math.ts"]);
    expect(view.packages.map((node) => node.id)).toEqual(["npm:express"]);
  });

  it("returns an empty view for an unknown path", () => {
    const view = neighborhood(GRAPH, "src/missing.ts");

    expect(view).toEqual({ imports: [], importedBy: [], packages: [] });
  });
});

describe("hubs", () => {
  it("ranks internal files by connection count and excludes packages", () => {
    const ranked = hubs(GRAPH);

    // src/app.ts has 1 importer and 2 imports, the highest total in the fixture.
    expect(ranked[0]?.node.id).toBe("src/app.ts");
    expect(ranked[0]?.incoming).toBe(1);
    expect(ranked[0]?.outgoing).toBe(2);
    expect(ranked.some((hub) => hub.node.group === "external")).toBe(false);
  });

  it("honours the limit", () => {
    expect(hubs(GRAPH, 1)).toHaveLength(1);
  });
});

describe("path helpers", () => {
  it("splits a path into a name and a directory", () => {
    expect(fileName("src/utils/math.ts")).toBe("math.ts");
    expect(directory("src/utils/math.ts")).toBe("src/utils");
    expect(directory("readme.md")).toBe("");
  });
});

describe("isExternalNode", () => {
  it("detects package nodes by id or group", () => {
    expect(isExternalNode({ id: "npm:zod", label: "zod" })).toBe(true);
    expect(isExternalNode({ id: "zod", label: "zod", group: "external" })).toBe(true);
    expect(isExternalNode({ id: "src/a.ts", label: "a.ts" })).toBe(false);
  });
});
