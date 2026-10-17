import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";

import { logger } from "@/config/logger";
import { AppError } from "@/errors/app-error";
import { failure } from "@/types/api";

interface NormalizedError {
  statusCode: number;
  code: string;
  message: string;
  details?: unknown;
}

function normalize(error: unknown): NormalizedError {
  if (error instanceof AppError) {
    return {
      statusCode: error.statusCode,
      code: error.code,
      message: error.message,
      details: error.details,
    };
  }

  if (error instanceof ZodError) {
    return {
      statusCode: 400,
      code: "VALIDATION_ERROR",
      message: "Request validation failed",
      details: error.issues,
    };
  }

  return {
    statusCode: 500,
    code: "INTERNAL_ERROR",
    message: "Internal server error",
  };
}

/**
 * Centralized error handler. Must be registered last.
 * Produces a consistent error envelope and logs unexpected (5xx) failures.
 */
export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  const normalized = normalize(error);

  if (normalized.statusCode >= 500) {
    logger.error({ err: error, method: req.method, url: req.originalUrl }, "Unhandled error");
  }

  const payload = failure(normalized.code, normalized.message, normalized.details);

  res.status(normalized.statusCode).json(payload);
};
