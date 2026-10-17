import { useCallback, useRef } from "react";

import { resourceKey, useAsyncResource, type AsyncResource } from "@/hooks/useAsyncResource";
import { fetchFileAnalysis } from "@/features/analysis/api";
import type { FileAnalysis } from "@/features/analysis/types";

export interface FileAnalysisResource extends AsyncResource<FileAnalysis> {
  regenerate: () => void;
}

/**
 * Loads the block-annotated walkthrough for a file. The response is memoized by
 * file, so revisiting a file is instant; `regenerate` bypasses the caches and
 * asks the server to re-run the analysis.
 */
export function useFileAnalysis(owner: string, name: string, path: string): FileAnalysisResource {
  const refreshRef = useRef(false);

  const resource = useAsyncResource<FileAnalysis>(
    (signal) => {
      const refresh = refreshRef.current;
      refreshRef.current = false;
      return fetchFileAnalysis(owner, name, path, refresh, signal);
    },
    resourceKey("file-analysis", owner, name, path),
    { enabled: path.length > 0 },
  );

  const { reload } = resource;

  const regenerate = useCallback(() => {
    refreshRef.current = true;
    reload();
  }, [reload]);

  return { ...resource, regenerate };
}
