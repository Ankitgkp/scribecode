import type { Request, Response } from "express";

import { env, githubOAuthConfigured } from "@/config/env";
import { AppError } from "@/errors/app-error";
import { githubClient } from "@/lib/github/client";
import { buildAuthorizeUrl, exchangeCodeForToken } from "@/lib/github/oauth";
import { logger } from "@/config/logger";
import { getValidated } from "@/middleware/validate";
import {
  OAUTH_STATE_COOKIE,
  generateOpaqueToken,
  oauthStateCookieOptions,
  sessionCookieName,
  sessionCookieOptions,
} from "@/modules/auth/auth.cookies";
import type { ConnectPatInput, OAuthCallbackInput } from "@/modules/auth/auth.schema";
import { oauthCallbackSchema } from "@/modules/auth/auth.schema";
import * as authService from "@/modules/auth/auth.service";
import type { AuthUser } from "@/types/express";
import { success } from "@/types/api";

interface SerializedUser {
  id: string;
  login: string;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
  connected: boolean;
}

function serializeUser(user: AuthUser): SerializedUser {
  return {
    id: user.id,
    login: user.login,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    connected: Boolean(user.account),
  };
}

function frontendBaseUrl(): string {
  return env.FRONTEND_URL.replace(/\/+$/, "");
}

export const authController = {
  getCurrentUser(req: Request, res: Response): void {
    if (!req.auth) {
      res.status(200).json(success({ authenticated: false, user: null }));
      return;
    }

    res.status(200).json(success({ authenticated: true, user: serializeUser(req.auth.user) }));
  },

  async connectWithPersonalAccessToken(_req: Request, res: Response): Promise<void> {
    const { token } = getValidated<ConnectPatInput>(res, "body");

    const github = await githubClient.getAuthenticatedUser(token);
    const user = await authService.upsertUserFromGitHub(github, token, null);
    const session = await authService.createSession(user.id);

    res.cookie(sessionCookieName(), session.token, sessionCookieOptions());
    res.status(200).json(success({ authenticated: true, user: serializeUser(user) }));
  },

  redirectToGitHub(_req: Request, res: Response): void {
    if (!githubOAuthConfigured) {
      throw new AppError("GitHub OAuth is not configured on this server", {
        statusCode: 503,
        code: "GITHUB_OAUTH_NOT_CONFIGURED",
      });
    }

    const state = generateOpaqueToken();
    res.cookie(OAUTH_STATE_COOKIE, state, oauthStateCookieOptions());
    res.redirect(buildAuthorizeUrl(state));
  },

  async handleOAuthCallback(req: Request, res: Response): Promise<void> {
    const frontend = frontendBaseUrl();
    const parsed = oauthCallbackSchema.safeParse(req.query);

    if (!parsed.success) {
      res.redirect(`${frontend}/?authError=invalid_callback`);
      return;
    }

    const expectedState = (req.cookies as Record<string, string> | undefined)?.[OAUTH_STATE_COOKIE];
    res.clearCookie(OAUTH_STATE_COOKIE, { ...oauthStateCookieOptions(), maxAge: undefined });

    if (!expectedState || expectedState !== (parsed.data as OAuthCallbackInput).state) {
      res.redirect(`${frontend}/?authError=state_mismatch`);
      return;
    }

    try {
      const token = await exchangeCodeForToken((parsed.data as OAuthCallbackInput).code);
      const github = await githubClient.getAuthenticatedUser(token.accessToken);
      const user = await authService.upsertUserFromGitHub(github, token.accessToken, token.scope);
      const session = await authService.createSession(user.id);

      res.cookie(sessionCookieName(), session.token, sessionCookieOptions());
      res.redirect(`${frontend}/repositories`);
    } catch (error) {
      logger.error({ err: error }, "GitHub OAuth callback failed");
      res.redirect(`${frontend}/?authError=oauth_failed`);
    }
  },

  async logout(req: Request, res: Response): Promise<void> {
    const token = (req.cookies as Record<string, string> | undefined)?.[sessionCookieName()];

    if (token) {
      await authService.revokeSession(token);
    }

    res.clearCookie(sessionCookieName(), { ...sessionCookieOptions(), maxAge: undefined });
    res.status(200).json(success({ authenticated: false }));
  },
};
