import { z } from "zod";

/**
 * Node/edge shape shared by every visualization the API produces
 * (dependency graphs, architecture maps, data-flow and sequence diagrams).
 *
 * Deliberately renderer-agnostic: the frontend reshapes it into whatever view
 * fits (focused lists, grouped cards, future diagrams) without per-kind
 * transformation logic.
 */
export const graphNodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  /** Free-form category used for styling (e.g. "module", "service", "external"). */
  group: z.string().optional(),
  description: z.string().optional(),
});

export const graphEdgeSchema = z.object({
  id: z.string().optional(),
  source: z.string(),
  target: z.string(),
  label: z.string().optional(),
});

export const graphSchema = z.object({
  nodes: z.array(graphNodeSchema),
  edges: z.array(graphEdgeSchema),
});

export type GraphNode = z.infer<typeof graphNodeSchema>;
export type GraphEdge = z.infer<typeof graphEdgeSchema>;
export type Graph = z.infer<typeof graphSchema>;

/** Normalizes edges so every one has a stable id. */
export function withEdgeIds(graph: Graph): Graph {
  return {
    nodes: graph.nodes,
    edges: graph.edges.map((edge, index) => ({
      ...edge,
      id: edge.id ?? `${edge.source}->${edge.target}:${index}`,
    })),
  };
}
