import { useEffect } from "react";

import { fetchFileAnalysis } from "@/features/analysis/api";
import { fetchFileContent } from "@/features/explorer/api";
import type { StoryStop } from "@/features/insights/lib/interview-story";
import { prefetchAsyncResource, resourceKey } from "@/hooks/useAsyncResource";

/** Warm two opening chapters, then stay only two chapters ahead. One model request at a time. */
export function useInterviewPreload(
  owner: string,
  name: string,
  stops: StoryStop[],
  index: number,
  active: boolean,
): void {
  useEffect(() => {
    let cancelled = false;
    const upcoming = active ? stops.slice(index, index + 3) : stops.slice(0, 2);
    async function warm(): Promise<void> {
      for (const stop of upcoming) {
        if (cancelled) break;
        if (!stop.readable) continue;
        await Promise.allSettled([
          prefetchAsyncResource(resourceKey("file-content", owner, name, stop.path), (signal) =>
            fetchFileContent(owner, name, stop.path, signal),
          ),
          prefetchAsyncResource(resourceKey("file-analysis", owner, name, stop.path), (signal) =>
            fetchFileAnalysis(owner, name, stop.path, false, signal),
          ),
        ]);
      }
    }
    void warm();
    return () => {
      cancelled = true;
    };
  }, [owner, name, stops, index, active]);
}
