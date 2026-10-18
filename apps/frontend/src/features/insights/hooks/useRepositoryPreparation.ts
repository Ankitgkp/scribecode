import { useCallback, useRef } from "react";

import { prepareRepository } from "@/features/insights/api";
import type { RepositoryPreparation } from "@/features/insights/types";
import { resourceKey, useAsyncResource, type AsyncResource } from "@/hooks/useAsyncResource";

export interface RepositoryPreparationResource extends AsyncResource<RepositoryPreparation> {
  refresh: () => void;
}

/** Prepares the two expensive repository-wide artifacts before a view needs them. */
export function useRepositoryPreparation(owner: string, name: string): RepositoryPreparationResource {
  const refreshRef = useRef(false);
  const resource = useAsyncResource<RepositoryPreparation>(
    (signal) => {
      const refresh = refreshRef.current;
      refreshRef.current = false;
      return prepareRepository(owner, name, refresh, signal);
    },
    resourceKey("repository-preparation", owner, name),
  );
  const { reload } = resource;

  const refresh = useCallback(() => {
    refreshRef.current = true;
    reload();
  }, [reload]);

  return { ...resource, refresh };
}
