import { describe, expect, it } from "vitest";

import { groupArchitecture, prettyGroupName } from "@/features/analysis/lib/architecture";
import type { Graph } from "@/types/graph";

const GRAPH: Graph = {
  nodes: [
    { id: "app", label: "Application", group: "root", description: "Entry point" },
    { id: "dir:api", label: "api", group: "module" },
    { id: "dir:lib", label: "lib", group: "module" },
    { id: "loose", label: "Loose module" },
  ],
  edges: [
    { source: "app", target: "dir:api", label: "uses" },
    { source: "app", target: "dir:lib", label: "uses" },
    { source: "dir:api", target: "dir:lib" },
    { source: "dir:api", target: "dir:api" },
  ],
};

describe("prettyGroupName", () => {
  it("humanizes separators and capitalizes", () => {
    expect(prettyGroupName("data-layer")).toBe("Data layer");
    expect(prettyGroupName("ui_components")).toBe("Ui components");
  });

  it("falls back to a generic name for empty groups", () => {
    expect(prettyGroupName("  ")).toBe("General");
  });
});

describe("groupArchitecture", () => {
  it("buckets nodes by group, largest group first", () => {
    const groups = groupArchitecture(GRAPH);

    expect(groups.map((group) => group.name)).toEqual(["module", "root", "General"]);
    expect(groups[0]?.nodes).toHaveLength(2);
  });

  it("resolves outgoing links and incoming counts", () => {
    const [modules] = groupArchitecture(GRAPH);
    const api = modules?.nodes.find((item) => item.node.id === "dir:api");

    expect(api?.links.map((node) => node.id)).toEqual(["dir:lib"]);
    expect(api?.incomingCount).toBe(1);
  });

  it("keeps node descriptions and ignores self-referencing edges", () => {
    const groups = groupArchitecture(GRAPH);
    const root = groups.find((group) => group.name === "root");
    const app = root?.nodes[0];

    expect(app?.node.description).toBe("Entry point");
    expect(app?.incomingCount).toBe(0);
  });

  it("places ungrouped nodes in a General bucket", () => {
    const groups = groupArchitecture(GRAPH);

    expect(groups[groups.length - 1]?.nodes[0]?.node.id).toBe("loose");
  });
});
