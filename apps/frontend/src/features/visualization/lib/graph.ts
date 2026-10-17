import type { Graph, GraphNode } from "@/types/graph";

/** True for third-party package nodes (the backend tags them `external`). */
export function isExternalNode(node: GraphNode): boolean {
  return node.group === "external" || node.id.startsWith("npm:");
}

export interface Neighborhood {
  /** Files this file imports. */
  imports: GraphNode[];
  /** Files that import this file. */
  importedBy: GraphNode[];
  /** Third-party packages this file pulls in. */
  packages: GraphNode[];
}

function sortByLabel(nodes: GraphNode[]): GraphNode[] {
  return [...nodes].sort((a, b) => a.label.localeCompare(b.label));
}

/**
 * A one-hop view of a single file. Far easier to read than the full import
 * graph, which becomes a hairball in any real repository.
 */
export function neighborhood(graph: Graph, path: string): Neighborhood {
  const nodesById = new Map(graph.nodes.map((node) => [node.id, node]));
  const imports = new Map<string, GraphNode>();
  const importedBy = new Map<string, GraphNode>();
  const packages = new Map<string, GraphNode>();

  for (const edge of graph.edges) {
    if (edge.source === path && edge.target !== path) {
      const target = nodesById.get(edge.target);

      if (!target) {
        continue;
      }

      if (isExternalNode(target)) {
        packages.set(target.id, target);
      } else {
        imports.set(target.id, target);
      }
    }

    if (edge.target === path && edge.source !== path) {
      const source = nodesById.get(edge.source);

      if (source && !isExternalNode(source)) {
        importedBy.set(source.id, source);
      }
    }
  }

  return {
    imports: sortByLabel([...imports.values()]),
    importedBy: sortByLabel([...importedBy.values()]),
    packages: sortByLabel([...packages.values()]),
  };
}

export interface Hub {
  node: GraphNode;
  incoming: number;
  outgoing: number;
}

/**
 * The most connected files in the repository. A short list of hubs is a much
 * better map of "where the code converges" than a 60-node graph.
 */
export function hubs(graph: Graph, limit = 8): Hub[] {
  const nodesById = new Map(graph.nodes.map((node) => [node.id, node]));
  const counts = new Map<string, { incoming: number; outgoing: number }>();

  const counterFor = (id: string): { incoming: number; outgoing: number } => {
    const existing = counts.get(id);

    if (existing) {
      return existing;
    }

    const created = { incoming: 0, outgoing: 0 };
    counts.set(id, created);

    return created;
  };

  for (const edge of graph.edges) {
    if (edge.source === edge.target) {
      continue;
    }

    counterFor(edge.source).outgoing += 1;
    counterFor(edge.target).incoming += 1;
  }

  const result: Hub[] = [];

  for (const [id, count] of counts) {
    const node = nodesById.get(id);

    if (!node || isExternalNode(node)) {
      continue;
    }

    result.push({ node, ...count });
  }

  return result
    .sort((a, b) => b.incoming + b.outgoing - (a.incoming + a.outgoing) || a.node.label.localeCompare(b.node.label))
    .slice(0, limit);
}

/** Trailing segment of a path, e.g. `src/lib/paths.ts` -> `paths.ts`. */
export function fileName(path: string): string {
  const segments = path.split("/");
  return segments[segments.length - 1] ?? path;
}

/** Everything before the file name, or an empty string for a root-level file. */
export function directory(path: string): string {
  const index = path.lastIndexOf("/");
  return index === -1 ? "" : path.slice(0, index);
}
