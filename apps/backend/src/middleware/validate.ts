import type { RequestHandler, Response } from "express";
import type { ZodType } from "zod";

import { AppError } from "@/errors/app-error";

export type RequestSource = "body" | "query" | "params";

interface ValidatedStore {
  body?: unknown;
  query?: unknown;
  params?: unknown;
}

const VALIDATED_KEY = "validated";

/**
 * Validates a request part against a Zod schema.
 *
 * Parsed output is stored on `res.locals.validated[source]` so controllers can read
 * coerced, type-safe values without mutating Express internals (e.g. `req.query`,
 * which is a read-only getter in Express 5).
 */
export function validate<T>(schema: ZodType<T>, source: RequestSource): RequestHandler {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      next(AppError.badRequest("Request validation failed", result.error.issues));
      return;
    }

    const store = (res.locals[VALIDATED_KEY] as ValidatedStore | undefined) ?? {};
    store[source] = result.data;
    res.locals[VALIDATED_KEY] = store;

    next();
  };
}

export function getValidated<T>(res: Response, source: RequestSource): T {
  const store = res.locals[VALIDATED_KEY] as ValidatedStore | undefined;
  return store?.[source] as T;
}
