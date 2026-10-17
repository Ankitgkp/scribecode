import { resourceKey, useAsyncResource, type AsyncResource } from "@/hooks/useAsyncResource";
import { fetchFileContent } from "@/features/explorer/api";
import type { FileContent } from "@/features/explorer/types";

export function useFileContent(owner: string, name: string, path: string): AsyncResource<FileContent> {
  return useAsyncResource(
    (signal) => fetchFileContent(owner, name, path, signal),
    resourceKey("file-content", owner, name, path),
    { enabled: path.length > 0 },
  );
}
