import { useCallback, useRef } from "react";

import { resourceKey, useAsyncResource, type AsyncResource } from "@/hooks/useAsyncResource";
import { fetchArchitecture } from "@/features/analysis/api";
import type { ArchitectureAnalysis } from "@/features/analysis/types";

export interface ArchitectureResource extends AsyncResource<ArchitectureAnalysis> {
  regenerate: () => void;
}

/**
 * Loads the repository architecture map. It is fetched once per repository and
 * memoized, so switching tabs never re-runs the model. `regenerate` forces a
 * fresh generation by bypassing both the client and server caches.
 */
export function useArchitecture(owner: string, name: string): ArchitectureResource {
  const refreshRef = useRef(false);

  const resource = useAsyncResource<ArchitectureAnalysis>(
    (signal) => {
      const refresh = refreshRef.current;
      refreshRef.current = false;
      return fetchArchitecture(owner, name, refresh, signal);
    },
    resourceKey("architecture", owner, name),
  );

  const { reload } = resource;

  const regenerate = useCallback(() => {
    refreshRef.current = true;
    reload();
  }, [reload]);

  return { ...resource, regenerate };
}
