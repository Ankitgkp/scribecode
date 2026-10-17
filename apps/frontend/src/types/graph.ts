/**
 * Node/edge shape shared by every diagram the API returns. It mirrors the
 * backend contract: a generic graph the frontend reshapes per view.
 */
export interface GraphNode {
  id: string;
  label: string;
  group?: string;
  description?: string;
}

export interface GraphEdge {
  id?: string;
  source: string;
  target: string;
  label?: string;
}

export interface Graph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}
