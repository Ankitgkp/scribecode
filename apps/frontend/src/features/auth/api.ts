import { env } from "@/lib/env";
import { apiClient } from "@/services/apiClient";
import type { SessionPayload } from "@/features/auth/types";

export function fetchSession(signal?: AbortSignal): Promise<SessionPayload> {
  return apiClient.get<SessionPayload>("/auth/me", signal);
}

export function connectWithPersonalAccessToken(token: string): Promise<SessionPayload> {
  return apiClient.post<SessionPayload>("/auth/pat", { token });
}

export function logout(): Promise<{ authenticated: boolean }> {
  return apiClient.post<{ authenticated: boolean }>("/auth/logout");
}

/** URL that starts the GitHub OAuth flow (a full-page navigation, not a fetch). */
export function githubOAuthUrl(): string {
  return `${env.apiBaseUrl}/auth/github`;
}
