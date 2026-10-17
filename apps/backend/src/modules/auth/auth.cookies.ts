import { randomBytes } from "node:crypto";

import type { CookieOptions } from "express";

import { env, isProduction } from "@/config/env";

export const OAUTH_STATE_COOKIE = "scribe_oauth_state";

export function sessionCookieName(): string {
  return env.SESSION_COOKIE_NAME;
}

export function sessionCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    path: "/",
    maxAge: env.SESSION_TTL_HOURS * 60 * 60 * 1000,
  };
}

export function oauthStateCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    path: "/",
    maxAge: 10 * 60 * 1000,
  };
}

export function generateOpaqueToken(): string {
  return randomBytes(32).toString("hex");
}
