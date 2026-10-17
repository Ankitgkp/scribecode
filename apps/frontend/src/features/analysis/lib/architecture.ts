import type { Graph, GraphNode } from "@/types/graph";

/** Bucket used when the model does not assign a node to a group. */
const UNGROUPED = "General";

export interface ArchitectureLink {
  node: GraphNode;
  /** Nodes this one points at (its outgoing edges). */
  links: GraphNode[];
  /** How many other nodes point here. */
  incomingCount: number;
}

export interface ArchitectureGroup {
  name: string;
  nodes: ArchitectureLink[];
}

/** Turns a model-authored group name into a readable heading. */
export function prettyGroupName(name: string): string {
  const cleaned = name.replace(/[-_]+/g, " ").trim();

  if (cleaned.length === 0) {
    return UNGROUPED;
  }

  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

/**
 * Reshapes a model-authored graph into grouped modules with resolved links, so
 * it can be rendered as readable cards instead of a node/edge canvas.
 *
 * Groups are ordered by size (largest first) so the most important modules lead.
 */
export function groupArchitecture(graph: Graph): ArchitectureGroup[] {
  const nodesById = new Map(graph.nodes.map((node) => [node.id, node]));
  const outgoing = new Map<string, GraphNode[]>();
  const incoming = new Map<string, Set<string>>();

  for (const edge of graph.edges) {
    if (edge.source === edge.target) {
      continue;
    }

    const target = nodesById.get(edge.target);

    if (target) {
      const links = outgoing.get(edge.source) ?? [];

      if (!links.some((node) => node.id === target.id)) {
        links.push(target);
      }

      outgoing.set(edge.source, links);
    }

    const sources = incoming.get(edge.target) ?? new Set<string>();
    sources.add(edge.source);
    incoming.set(edge.target, sources);
  }

  const buckets = new Map<string, ArchitectureLink[]>();

  for (const node of graph.nodes) {
    const key = node.group && node.group.trim().length > 0 ? node.group : UNGROUPED;

    const link: ArchitectureLink = {
      node,
      links: (outgoing.get(node.id) ?? []).sort((a, b) => a.label.localeCompare(b.label)),
      incomingCount: incoming.get(node.id)?.size ?? 0,
    };

    const bucket = buckets.get(key);

    if (bucket) {
      bucket.push(link);
    } else {
      buckets.set(key, [link]);
    }
  }

  return [...buckets.entries()]
    .map(([name, nodes]) => ({
      name,
      nodes: [...nodes].sort((a, b) => a.node.label.localeCompare(b.node.label)),
    }))
    .sort((a, b) => {
      if (a.name === UNGROUPED) return 1;
      if (b.name === UNGROUPED) return -1;

      return b.nodes.length - a.nodes.length || a.name.localeCompare(b.name);
    });
}
