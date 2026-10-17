import { repoPath } from "@/lib/paths";
import { apiClient } from "@/services/apiClient";
import type { ArchitectureAnalysis, FileAnalysis } from "@/features/analysis/types";

export function fetchFileAnalysis(
  owner: string,
  name: string,
  path: string,
  refresh: boolean,
  signal?: AbortSignal,
): Promise<FileAnalysis> {
  return apiClient
    .post<{ analysis: FileAnalysis }>(`/analysis/${repoPath(owner, name)}/file`, { path, refresh }, signal)
    .then((payload) => payload.analysis);
}

export function fetchArchitecture(
  owner: string,
  name: string,
  refresh: boolean,
  signal?: AbortSignal,
): Promise<ArchitectureAnalysis> {
  return apiClient
    .post<{ analysis: ArchitectureAnalysis }>(`/analysis/${repoPath(owner, name)}/architecture`, { refresh }, signal)
    .then((payload) => payload.analysis);
}
