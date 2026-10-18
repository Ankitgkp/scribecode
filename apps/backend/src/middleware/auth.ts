import type { RequestHandler } from "express";

import { env } from "@/config/env";
import { AppError } from "@/errors/app-error";
import { findValidSession } from "@/modules/auth/auth.service";

function readSessionToken(req: Parameters<RequestHandler>[0]): string | undefined {
  return (req.cookies as Record<string, string> | undefined)?.[env.SESSION_COOKIE_NAME];
}

/**
 * Rejects the request unless a valid session cookie is present.
 */
export const requireAuth: RequestHandler = async (req, _res, next) => {
  const token = readSessionToken(req);

  if (!token) {
    next(new AppError("Authentication required", { statusCode: 401, code: "UNAUTHENTICATED" }));
    return;
  }

  const session = await findValidSession(token);

  if (!session) {
    next(new AppError("Session is invalid or has expired", { statusCode: 401, code: "UNAUTHENTICATED" }));
    return;
  }

  req.auth = { user: session.user, session };
  next();
};

/**
 * Attaches the authenticated context when a valid session exists, but never
 * rejects the request.
 */
export const optionalAuth: RequestHandler = async (req, _res, next) => {
  const token = readSessionToken(req);

  if (token) {
    const session = await findValidSession(token);
    if (session) {
      req.auth = { user: session.user, session };
    }
  }

  next();
};

/**
 * Returns the authenticated user id for handlers mounted behind `requireAuth`,
 * throwing a typed error if the context is somehow missing.
 */
export function authUserId(req: Parameters<RequestHandler>[0]): string {
  const userId = req.repositoryUserId ?? req.auth?.user.id;

  if (!userId) {
    throw new AppError("Authentication required", { statusCode: 401, code: "UNAUTHENTICATED" });
  }

  return userId;
}
