import type { RequestHandler } from "express";

import { AppError } from "@/errors/app-error";

/**
 * Converts unmatched requests into a 404 that flows through the central error handler.
 */
export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(AppError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
};
