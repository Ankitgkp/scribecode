import { repoPath } from "@/lib/paths";
import { apiClient } from "@/services/apiClient";
import type { FileContent, FileTreeEntry } from "@/features/explorer/types";

export function fetchFileTree(owner: string, name: string, signal?: AbortSignal): Promise<FileTreeEntry[]> {
  return apiClient
    .get<{ files: FileTreeEntry[] }>(`/files/${repoPath(owner, name)}/tree`, signal)
    .then((payload) => payload.files);
}

export function fetchFileContent(
  owner: string,
  name: string,
  path: string,
  signal?: AbortSignal,
): Promise<FileContent> {
  const query = new URLSearchParams({ path }).toString();

  return apiClient
    .get<{ file: FileContent }>(`/files/${repoPath(owner, name)}/content?${query}`, signal)
    .then((payload) => payload.file);
}
