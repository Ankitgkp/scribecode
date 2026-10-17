import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError, apiClient } from "@/services/apiClient";

function mockFetch(response: { ok: boolean; status: number; json: () => Promise<unknown> }) {
  const fetchMock = vi.fn().mockResolvedValue(response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("apiClient", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("unwraps a successful response envelope", async () => {
    const fetchMock = mockFetch({
      ok: true,
      status: 200,
      json: async () => ({ success: true, data: { status: "ok" } }),
    });

    const result = await apiClient.get<{ status: string }>("/health");

    expect(result).toEqual({ status: "ok" });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/health"),
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("throws an ApiError when the envelope reports failure", async () => {
    mockFetch({
      ok: false,
      status: 503,
      json: async () => ({ success: false, error: { code: "UNAVAILABLE", message: "Service unavailable" } }),
    });

    await expect(apiClient.get("/health")).rejects.toBeInstanceOf(ApiError);
    await expect(apiClient.get("/health")).rejects.toMatchObject({ code: "UNAVAILABLE", status: 503 });
  });
});
