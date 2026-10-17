import { env } from "@/config/env";
import { AppError } from "@/errors/app-error";

export interface GitHubTokenResponse {
  accessToken: string;
  scope: string | null;
  tokenType: string | null;
}

interface RawTokenResponse {
  access_token?: string;
  scope?: string;
  token_type?: string;
  error?: string;
  error_description?: string;
}

/**
 * Exchanges an OAuth authorization code for an access token.
 */
export async function exchangeCodeForToken(code: string): Promise<GitHubTokenResponse> {
  let response: Response;

  try {
    response = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });
  } catch (error) {
    throw new AppError("Failed to reach GitHub to exchange the OAuth code", {
      statusCode: 502,
      code: "GITHUB_OAUTH_FAILED",
      cause: error,
    });
  }

  const data = (await response.json()) as RawTokenResponse;

  if (!response.ok || !data.access_token) {
    throw new AppError(data.error_description ?? "GitHub rejected the OAuth code exchange", {
      statusCode: 502,
      code: "GITHUB_OAUTH_FAILED",
    });
  }

  return {
    accessToken: data.access_token,
    scope: data.scope ?? null,
    tokenType: data.token_type ?? null,
  };
}

export function buildAuthorizeUrl(state: string): string {
  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", env.GITHUB_CLIENT_ID ?? "");
  url.searchParams.set("redirect_uri", env.GITHUB_OAUTH_CALLBACK_URL);
  url.searchParams.set("scope", env.GITHUB_SCOPES);
  url.searchParams.set("state", state);
  return url.toString();
}
