import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
  analysisFindFirst: vi.fn(),
  analysisCreate: vi.fn(),
  getConnectedRepository: vi.fn(),
  getGitHubAccessToken: vi.fn(),
  getFileContent: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    repositoryFile: { findUnique: mocks.findUnique },
    analysis: { findFirst: mocks.analysisFindFirst, create: mocks.analysisCreate },
  },
}));
vi.mock("@/lib/github/account", () => ({ getGitHubAccessToken: mocks.getGitHubAccessToken }));
vi.mock("@/lib/github/client", () => ({ githubClient: { getFileContent: mocks.getFileContent } }));
vi.mock("@/modules/repositories/repositories.service", () => ({
  getConnectedRepository: mocks.getConnectedRepository,
}));

const { getFileContent } = await import("@/modules/files/files.service");

describe("getFileContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getConnectedRepository.mockResolvedValue({ id: "repo-1", defaultBranch: "main" });
    mocks.findUnique.mockResolvedValue({ path: "src/index.ts", type: "blob", sha: "blob-1" });
    mocks.analysisFindFirst.mockResolvedValue(null);
    mocks.getGitHubAccessToken.mockResolvedValue("token");
    mocks.getFileContent.mockResolvedValue({
      path: "src/index.ts", sha: "blob-1", size: 12, content: "export const x = 1;",
    });
  });

  it("shares one fetch between simultaneous chapter and analysis requests", async () => {
    const [first, second] = await Promise.all([
      getFileContent("user-1", "acme", "app", "src/index.ts"),
      getFileContent("user-1", "acme", "app", "src/index.ts"),
    ]);

    expect(first).toEqual(second);
    expect(mocks.getFileContent).toHaveBeenCalledOnce();
    expect(mocks.analysisCreate).toHaveBeenCalledOnce();
  });

  it("reuses source cached for the same Git blob", async () => {
    mocks.analysisFindFirst.mockResolvedValue({
      content: { path: "src/index.ts", sha: "blob-1", size: 12, content: "cached", truncated: false },
    });

    const file = await getFileContent("user-1", "acme", "app", "src/index.ts");

    expect(file.content).toBe("cached");
    expect(mocks.getGitHubAccessToken).not.toHaveBeenCalled();
    expect(mocks.getFileContent).not.toHaveBeenCalled();
  });
});
