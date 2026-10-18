/**
 * Shape of every response returned by the Scribecode API.
 * The backend always wraps payloads in this envelope.
 */
export interface ApiErrorBody {
  code: string;
  message: string;
  details?: unknown;
}

export type ApiResponse<TData> = { success: true; data: TData } | { success: false; error: ApiErrorBody };

export interface HealthPayload {
  status: "ok";
  uptime: number;
  timestamp: string;
  version: string;
  environment: string;
}
