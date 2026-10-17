import { useAsyncResource, type AsyncResource } from "@/hooks/useAsyncResource";
import { fetchConnectedRepositories } from "@/features/repositories/api";
import type { ConnectedRepository } from "@/features/repositories/types";

export function useConnectedRepositories(): AsyncResource<ConnectedRepository[]> {
  return useAsyncResource((signal) => fetchConnectedRepositories(signal), "repositories:connected");
}
