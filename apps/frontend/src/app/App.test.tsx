import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { App } from "@/app/App";

const healthPayload = {
  status: "ok",
  uptime: 1.5,
  timestamp: new Date().toISOString(),
  version: "0.1.0",
  environment: "test",
};

const sessionPayload = { authenticated: false, user: null };

function jsonResponse(body: unknown) {
  return { ok: true, status: 200, json: async () => body };
}

function stubFetch() {
  vi.stubGlobal(
    "fetch",
    vi.fn((input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

      if (url.includes("/auth/me")) {
        return Promise.resolve(jsonResponse({ success: true, data: sessionPayload }));
      }

      return Promise.resolve(jsonResponse({ success: true, data: healthPayload }));
    }),
  );
}

describe("App", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the home page through the router", async () => {
    stubFetch();

    render(<App />);

    expect(await screen.findAllByText(/Codebase Explorer/)).not.toHaveLength(0);
    expect(await screen.findByText("Connect GitHub")).toBeInTheDocument();
    expect(await screen.findByText("Healthy")).toBeInTheDocument();
  });
});
