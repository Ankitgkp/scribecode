/**
 * Response envelope shared by every API endpoint.
 * Keeping it in one place guarantees consistent, predictable responses.
 */
export interface ApiErrorBody {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiSuccessBody<TData> {
  success: true;
  data: TData;
}

export interface ApiErrorEnvelope {
  success: false;
  error: ApiErrorBody;
}

export type ApiResponse<TData> = ApiSuccessBody<TData> | ApiErrorEnvelope;

export function success<TData>(data: TData): ApiSuccessBody<TData> {
  return { success: true, data };
}

export function failure(code: string, message: string, details?: unknown): ApiErrorEnvelope {
  return {
    success: false,
    error: {
      code,
      message,
      ...(details === undefined ? {} : { details }),
    },
  };
}
