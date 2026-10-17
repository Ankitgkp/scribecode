import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApp } from "@/app";

const app = createApp();

describe("GET /api/v1/health", () => {
  it("returns a healthy response envelope", async () => {
    const response = await request(app).get("/api/v1/health");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ success: true });
    expect(response.body.data).toMatchObject({ status: "ok", environment: "test" });
    expect(response.body.data.uptime).toBeTypeOf("number");
  });

  it("includes memory details when verbose is requested", async () => {
    const response = await request(app).get("/api/v1/health?verbose=true");

    expect(response.status).toBe(200);
    expect(response.body.data.memory).toMatchObject({
      rss: expect.any(Number),
      heapUsed: expect.any(Number),
    });
  });

  it("rejects an invalid query parameter", async () => {
    const response = await request(app).get("/api/v1/health?verbose=maybe");

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({ success: false, error: { code: "BAD_REQUEST" } });
  });
});

describe("unknown routes", () => {
  it("returns a consistent 404 envelope", async () => {
    const response = await request(app).get("/api/v1/does-not-exist");

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({ success: false, error: { code: "NOT_FOUND" } });
  });
});
