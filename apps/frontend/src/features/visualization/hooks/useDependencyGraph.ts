import { useCallback, useRef } from "react";

import { useAsyncResource, resourceKey, type AsyncResource } from "@/hooks/useAsyncResource";
import { fetchDependencyGraph } from "@/features/visualization/api";
import type { Graph } from "@/types/graph";

export interface DependencyGraphResource extends AsyncResource<Graph> {
  rebuild: () => void;
}

/**
 * Loads the repository's dependency graph. It is fetched once per repository
 * and memoized, so switching tabs never rebuilds it. `rebuild` bypasses both
 * the client cache and the server-side cache.
 */
export function useDependencyGraph(owner: string, name: string): DependencyGraphResource {
  const refreshRef = useRef(false);

  const resource = useAsyncResource<Graph>(
    (signal) => {
      const refresh = refreshRef.current;
      refreshRef.current = false;
      return fetchDependencyGraph(owner, name, refresh, signal);
    },
    resourceKey("dependency-graph", owner, name),
  );

  const { reload } = resource;

  const rebuild = useCallback(() => {
    refreshRef.current = true;
    reload();
  }, [reload]);

  return { ...resource, rebuild };
}
