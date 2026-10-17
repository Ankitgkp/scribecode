import { resourceKey, useAsyncResource, type AsyncResource } from "@/hooks/useAsyncResource";
import { fetchFileTree } from "@/features/explorer/api";
import type { FileTreeEntry } from "@/features/explorer/types";

export function useFileTree(owner: string, name: string): AsyncResource<FileTreeEntry[]> {
  return useAsyncResource((signal) => fetchFileTree(owner, name, signal), resourceKey("file-tree", owner, name));
}
