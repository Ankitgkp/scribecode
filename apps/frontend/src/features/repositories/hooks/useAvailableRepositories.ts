import { useAsyncResource, type AsyncResource } from "@/hooks/useAsyncResource";
import { fetchAvailableRepositories } from "@/features/repositories/api";
import type { GitHubRepositorySummary } from "@/features/repositories/types";

export function useAvailableRepositories(): AsyncResource<GitHubRepositorySummary[]> {
  return useAsyncResource((signal) => fetchAvailableRepositories(signal), "repositories:available");
}
