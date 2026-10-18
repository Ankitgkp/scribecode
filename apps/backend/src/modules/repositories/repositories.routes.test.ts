import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApp } from "@/app";

const app = createApp();

const protectedRequests = [
  { method: "get" as const, path: "/api/v1/repositories" },
  { method: "get" as const, path: "/api/v1/repositories/available" },
  { method: "get" as const, path: "/api/v1/repositories/acme/app" },
  { method: "post" as const, path: "/api/v1/repositories/acme/app/sync" },
  { method: "get" as const, path: "/api/v1/files/acme/app/tree" },
  { method: "get" as const, path: "/api/v1/files/acme/app/content?path=README.md" },
  { method: "get" as const, path: "/api/v1/graph/acme/app/dependency" },
  { method: "post" as const, path: "/api/v1/analysis/acme/app/file" },
  { method: "post" as const, path: "/api/v1/analysis/acme/app/architecture" },
  { method: "post" as const, path: "/api/v1/analysis/acme/app/prepare" },
  { method: "post" as const, path: "/api/v1/analysis/acme/app/interview/question" },
];

describe("authentication boundary", () => {
  it.each(protectedRequests)("requires a session for $method $path", async ({ method, path }) => {
    const response = await request(app)[method](path).send({});

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      success: false,
      error: { code: "UNAUTHENTICATED" },
    });
  });
});
