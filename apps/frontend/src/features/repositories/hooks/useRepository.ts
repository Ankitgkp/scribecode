import { resourceKey, useAsyncResource, type AsyncResource } from "@/hooks/useAsyncResource";
import { fetchRepository } from "@/features/repositories/api";
import type { ConnectedRepository } from "@/features/repositories/types";

export function useRepository(owner: string, name: string): AsyncResource<ConnectedRepository> {
  return useAsyncResource((signal) => fetchRepository(owner, name, signal), resourceKey("repository", owner, name));
}
