import { describe, expect, it } from "vitest";

import { mapGitHubError } from "@/lib/github/client";

describe("mapGitHubError", () => {
  it("identifies GitHub's rate-limit 403 separately from missing permissions", () => {
    const limited = mapGitHubError(
      { status: 403, message: "API rate limit exceeded", response: { headers: { "x-ratelimit-remaining": "0" } } },
      "fetching a file",
    );
    const forbidden = mapGitHubError({ status: 403, message: "Resource not accessible" }, "fetching a file");

    expect(limited).toMatchObject({ statusCode: 429, code: "GITHUB_RATE_LIMITED" });
    expect(forbidden).toMatchObject({ statusCode: 403, code: "GITHUB_FORBIDDEN" });
  });
});
