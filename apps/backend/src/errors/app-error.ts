interface AppErrorOptions {
  statusCode?: number;
  code?: string;
  details?: unknown;
  isOperational?: boolean;
  cause?: unknown;
}

/**
 * Operational error carrying an HTTP status and a machine-readable code.
 * The centralized error handler turns these into consistent API responses.
 */
export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details?: unknown;
  readonly isOperational: boolean;

  constructor(message: string, options: AppErrorOptions = {}) {
    super(message, options.cause === undefined ? undefined : { cause: options.cause });
    this.name = "AppError";
    this.statusCode = options.statusCode ?? 500;
    this.code = options.code ?? "INTERNAL_ERROR";
    this.details = options.details;
    this.isOperational = options.isOperational ?? true;
  }

  static badRequest(message = "Bad request", details?: unknown): AppError {
    return new AppError(message, { statusCode: 400, code: "BAD_REQUEST", details });
  }

  static notFound(message = "Resource not found"): AppError {
    return new AppError(message, { statusCode: 404, code: "NOT_FOUND" });
  }

  static serviceUnavailable(message = "Service unavailable", details?: unknown): AppError {
    return new AppError(message, { statusCode: 503, code: "SERVICE_UNAVAILABLE", details });
  }
}
