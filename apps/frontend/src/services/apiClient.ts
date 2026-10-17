import { env } from "@/lib/env";
import type { ApiResponse } from "@/types/api";

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status: number, code = "REQUEST_FAILED") {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface RequestConfig {
  method?: HttpMethod;
  body?: unknown;
  signal?: AbortSignal;
}

async function request<TData>(path: string, config: RequestConfig = {}): Promise<TData> {
  const { method = "GET", body, signal } = config;

  const response = await fetch(`${env.apiBaseUrl}${path}`, {
    method,
    signal,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const payload = (await response.json().catch(() => null)) as ApiResponse<TData> | null;

  if (!response.ok || payload === null || payload.success === false) {
    if (payload !== null && payload.success === false) {
      throw new ApiError(payload.error.message, response.status, payload.error.code);
    }

    throw new ApiError(response.statusText || "Request failed", response.status);
  }

  return payload.data;
}

export const apiClient = {
  get: <TData>(path: string, signal?: AbortSignal) => request<TData>(path, { method: "GET", signal }),
  post: <TData>(path: string, body?: unknown, signal?: AbortSignal) =>
    request<TData>(path, { method: "POST", body, signal }),
  put: <TData>(path: string, body?: unknown, signal?: AbortSignal) =>
    request<TData>(path, { method: "PUT", body, signal }),
  patch: <TData>(path: string, body?: unknown, signal?: AbortSignal) =>
    request<TData>(path, { method: "PATCH", body, signal }),
  delete: <TData>(path: string, signal?: AbortSignal) => request<TData>(path, { method: "DELETE", signal }),
};
