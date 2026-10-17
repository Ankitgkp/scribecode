import { describe, expect, it } from "vitest";

import { buildFileTree, filterFileTree } from "@/features/explorer/lib/buildFileTree";

describe("buildFileTree", () => {
  it("nests entries and sorts directories before files", () => {
    const tree = buildFileTree([
      { path: "src/index.ts", type: "blob", size: 1 },
      { path: "README.md", type: "blob", size: 1 },
      { path: "src/utils/math.ts", type: "blob", size: 1 },
    ]);

    expect(tree.map((node) => node.name)).toEqual(["src", "README.md"]);
    expect(tree[0]?.children.map((node) => node.name)).toEqual(["utils", "index.ts"]);
  });

  it("ignores non-file entries", () => {
    const tree = buildFileTree([{ path: "src", type: "tree", size: 0 }]);

    expect(tree).toEqual([]);
  });
});

describe("filterFileTree", () => {
  it("keeps matching files and their ancestors", () => {
    const tree = buildFileTree([
      { path: "src/index.ts", type: "blob", size: 1 },
      { path: "src/utils/math.ts", type: "blob", size: 1 },
    ]);

    const filtered = filterFileTree(tree, "math");

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.name).toBe("src");
    expect(filtered[0]?.children[0]?.name).toBe("utils");
    expect(filtered[0]?.children[0]?.children[0]?.name).toBe("math.ts");
  });
});
