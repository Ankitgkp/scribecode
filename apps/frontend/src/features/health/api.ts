import { apiClient } from "@/services/apiClient";
import type { HealthPayload } from "@/types/api";

export function fetchHealth(signal?: AbortSignal): Promise<HealthPayload> {
  return apiClient.get<HealthPayload>("/health", signal);
}
