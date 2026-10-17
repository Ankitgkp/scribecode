import { repoPath } from "@/lib/paths";
import { apiClient } from "@/services/apiClient";
import type { Graph } from "@/types/graph";

/** Maximum number of source files the server analyzes when building the graph. */
export const DEFAULT_GRAPH_LIMIT = 60;

export function fetchDependencyGraph(
  owner: string,
  name: string,
  refresh: boolean,
  signal?: AbortSignal,
  limit: number = DEFAULT_GRAPH_LIMIT,
): Promise<Graph> {
  const query = new URLSearchParams({ limit: String(limit), refresh: String(refresh) }).toString();

  return apiClient
    .get<{ graph: Graph }>(`/graph/${repoPath(owner, name)}/dependency?${query}`, signal)
    .then((payload) => payload.graph);
}
