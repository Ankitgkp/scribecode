import { repoPath } from "@/lib/paths";
import { apiClient } from "@/services/apiClient";
import type { ConnectedRepository, GitHubRepositorySummary } from "@/features/repositories/types";

export function fetchAvailableRepositories(signal?: AbortSignal): Promise<GitHubRepositorySummary[]> {
  return apiClient
    .get<{ repositories: GitHubRepositorySummary[] }>("/repositories/available", signal)
    .then((payload) => payload.repositories);
}

export function fetchConnectedRepositories(signal?: AbortSignal): Promise<ConnectedRepository[]> {
  return apiClient
    .get<{ repositories: ConnectedRepository[] }>("/repositories", signal)
    .then((payload) => payload.repositories);
}

export function fetchRepository(owner: string, name: string, signal?: AbortSignal): Promise<ConnectedRepository> {
  return apiClient
    .get<{ repository: ConnectedRepository }>(`/repositories/${repoPath(owner, name)}`, signal)
    .then((payload) => payload.repository);
}

export function connectRepository(input: { owner: string; name: string }): Promise<ConnectedRepository> {
  return apiClient
    .post<{ repository: ConnectedRepository }>("/repositories", input)
    .then((payload) => payload.repository);
}

export function syncRepository(owner: string, name: string): Promise<{ fileCount: number }> {
  return apiClient.post<{ fileCount: number }>(`/repositories/${repoPath(owner, name)}/sync`);
}
