import { AppError } from "@/errors/app-error";
import { prisma } from "@/lib/prisma";
import { getGitHubAccessToken } from "@/lib/github/account";
import { githubClient, type GitHubRepository } from "@/lib/github/client";

export interface SyncResult {
  fileCount: number;
}

export async function listAvailableRepositories(
  userId: string,
  options: { page: number; perPage: number },
): Promise<GitHubRepository[]> {
  const token = await getGitHubAccessToken(userId);
  return githubClient.listRepositories(token, options);
}

export async function connectRepository(userId: string, owner: string, name: string) {
  const token = await getGitHubAccessToken(userId);
  const repo = await githubClient.getRepository(token, owner, name);

  return prisma.repository.upsert({
    where: { userId_githubId: { userId, githubId: BigInt(repo.id) } },
    create: {
      userId,
      githubId: BigInt(repo.id),
      owner: repo.owner,
      name: repo.name,
      fullName: repo.fullName,
      description: repo.description,
      defaultBranch: repo.defaultBranch,
      language: repo.language,
      isPrivate: repo.isPrivate,
    },
    update: {
      fullName: repo.fullName,
      description: repo.description,
      defaultBranch: repo.defaultBranch,
      language: repo.language,
      isPrivate: repo.isPrivate,
    },
  });
}

export async function listConnectedRepositories(userId: string) {
  return prisma.repository.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getConnectedRepository(userId: string, owner: string, name: string) {
  const repository = await prisma.repository.findFirst({ where: { userId, owner, name } });

  if (!repository) {
    throw AppError.notFound(`Repository ${owner}/${name} is not connected yet`);
  }

  return repository;
}

/**
 * Refreshes the cached file tree for a connected repository from GitHub.
 */
export async function syncRepositoryFiles(userId: string, owner: string, name: string): Promise<SyncResult> {
  const repository = await getConnectedRepository(userId, owner, name);
  const token = await getGitHubAccessToken(userId);
  const tree = await githubClient.getTree(token, owner, name, repository.defaultBranch);

  await prisma.$transaction([
    prisma.repositoryFile.deleteMany({ where: { repositoryId: repository.id } }),
    // Every repository-wide insight is derived from this tree. Remove it in the
    // same sync transaction so an old map can never be served for new files.
    prisma.analysis.deleteMany({ where: { repositoryId: repository.id } }),
    prisma.repositoryFile.createMany({
      data: tree.map((entry) => ({
        repositoryId: repository.id,
        path: entry.path,
        sha: entry.sha,
        type: entry.type,
        size: entry.size,
      })),
    }),
  ]);

  return { fileCount: tree.length };
}
