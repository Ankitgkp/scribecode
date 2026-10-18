import { describe, expect, it } from "vitest";

import { parseGitHubRepository } from "@/features/repositories/lib/parseGitHubRepository";

describe("parseGitHubRepository", () => {
  it.each([
    ["https://github.com/owner/repo", { owner: "owner", name: "repo" }],
    ["github.com/owner/repo.git/", { owner: "owner", name: "repo" }],
    [" https://github.com/Owner/my.repo?tab=readme ", { owner: "Owner", name: "my.repo" }],
  ])("reads %s", (value, expected) => {
    expect(parseGitHubRepository(value)).toEqual(expected);
  });

  it.each([
    "",
    "https://gitlab.com/owner/repo",
    "https://github.com/owner",
    "https://github.com/owner/repo/tree/main",
    "https://user:password@github.com/owner/repo",
    "https://github.com:1234/owner/repo",
  ])("rejects %s", (value) => {
    expect(parseGitHubRepository(value)).toBeNull();
  });
});
