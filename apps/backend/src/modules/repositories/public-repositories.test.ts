import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  accountFindUnique: vi.fn(),
  userUpsert: vi.fn(),
  repositoryUpsert: vi.fn(),
  getRepository: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    gitHubAccount: { findUnique: mocks.accountFindUnique },
    user: { upsert: mocks.userUpsert },
    repository: { upsert: mocks.repositoryUpsert },
  },
}));

vi.mock("@/lib/github/client", () => ({ githubClient: { getRepository: mocks.getRepository } }));

const { openRepository, PUBLIC_REPOSITORY_USER_ID } = await import("@/modules/repositories/public-repositories");

const publicRepo = {
  id: "123",
  owner: "Acme",
  name: "project",
  fullName: "Acme/project",
  description: "Example",
  defaultBranch: "main",
  language: "TypeScript",
  isPrivate: false,
};

describe("openRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getRepository.mockResolvedValue(publicRepo);
    mocks.accountFindUnique.mockResolvedValue({ accessToken: "user-token" });
    mocks.repositoryUpsert.mockResolvedValue({ ...publicRepo, id: "repo-1" });
  });

  it("opens a public repository without GitHub sign-in", async () => {
    await openRepository("acme", "project");

    expect(mocks.getRepository).toHaveBeenCalledWith("", "acme", "project");
    expect(mocks.userUpsert).toHaveBeenCalledOnce();
    expect(mocks.repositoryUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId_githubId: { userId: PUBLIC_REPOSITORY_USER_ID, githubId: 123n } },
        create: expect.objectContaining({ userId: PUBLIC_REPOSITORY_USER_ID, isPrivate: false }),
      }),
    );
  });

  it("uses the signed-in account for private repositories", async () => {
    mocks.getRepository.mockResolvedValue({ ...publicRepo, isPrivate: true });
    await openRepository("acme", "project", "user-1");

    expect(mocks.getRepository).toHaveBeenCalledWith("user-token", "acme", "project");
    expect(mocks.userUpsert).not.toHaveBeenCalled();
    expect(mocks.repositoryUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ create: expect.objectContaining({ userId: "user-1", isPrivate: true }) }),
    );
  });

  it("does not put a private repository in the public cache", async () => {
    mocks.getRepository.mockResolvedValue({ ...publicRepo, isPrivate: true });

    await expect(openRepository("acme", "project")).rejects.toMatchObject({ statusCode: 404 });
    expect(mocks.userUpsert).not.toHaveBeenCalled();
    expect(mocks.repositoryUpsert).not.toHaveBeenCalled();
  });
});
