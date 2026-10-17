import type { Express } from "express";
import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * Builds the app with a controlled environment so these tests never depend on
 * the developer's local `.env` (which may or may not contain GitHub credentials).
 */
async function createAppWithEnv(overrides: Record<string, string> = {}): Promise<Express> {
  vi.resetModules();

  const stubs = {
    GITHUB_CLIENT_ID: "",
    GITHUB_CLIENT_SECRET: "",
    ...overrides,
  };

  for (const [key, value] of Object.entries(stubs)) {
    vi.stubEnv(key, value);
  }

  const { createApp } = await import("@/app");
  return createApp();
}

describe("auth routes", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("reports an anonymous session when no cookie is present", async () => {
    const app = await createAppWithEnv();
    const response = await request(app).get("/api/v1/auth/me");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      data: { authenticated: false, user: null },
    });
  });

  it("rejects a personal access token request without a token", async () => {
    const app = await createAppWithEnv();
    const response = await request(app).post("/api/v1/auth/pat").send({});

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({ success: false, error: { code: "BAD_REQUEST" } });
  });

  it("explains that OAuth is not configured when credentials are missing", async () => {
    const app = await createAppWithEnv();
    const response = await request(app).get("/api/v1/auth/github");

    expect(response.status).toBe(503);
    expect(response.body).toMatchObject({
      success: false,
      error: { code: "GITHUB_OAUTH_NOT_CONFIGURED" },
    });
  });

  it("redirects to GitHub when OAuth is configured", async () => {
    const app = await createAppWithEnv({
      GITHUB_CLIENT_ID: "client-id",
      GITHUB_CLIENT_SECRET: "client-secret",
    });

    const response = await request(app).get("/api/v1/auth/github");

    expect(response.status).toBe(302);
    expect(response.headers.location).toContain("https://github.com/login/oauth/authorize");
    expect(response.headers.location).toContain("client_id=client-id");
  });

  it("clears the session on logout", async () => {
    const app = await createAppWithEnv();
    const response = await request(app).post("/api/v1/auth/logout");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ success: true, data: { authenticated: false } });
  });
});
