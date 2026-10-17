import { useCallback, useEffect, useState } from "react";

import { fetchHealth } from "@/features/health/api";
import type { HealthPayload } from "@/types/api";

type HealthState =
  | { status: "loading"; data?: undefined; error?: undefined }
  | { status: "success"; data: HealthPayload; error?: undefined }
  | { status: "error"; data?: undefined; error: string };

export function useHealth() {
  const [state, setState] = useState<HealthState>({ status: "loading" });

  const load = useCallback(async (signal?: AbortSignal) => {
    setState({ status: "loading" });

    try {
      const data = await fetchHealth(signal);
      setState({ status: "success", data });
    } catch (error) {
      if (signal?.aborted) {
        return;
      }

      setState({ status: "error", error: error instanceof Error ? error.message : "Unknown error" });
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);

    return () => {
      controller.abort();
    };
  }, [load]);

  return {
    ...state,
    refresh: () => void load(),
  };
}
