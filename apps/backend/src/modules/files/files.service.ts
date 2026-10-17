import { getGitHubAccessToken } from "@/lib/github/account";
import { githubClient } from "@/lib/github/client";
import { prisma } from "@/lib/prisma";
import { getConnectedRepository, syncRepositoryFiles } from "@/modules/repositories/repositories.service";

/** Files larger than this are truncated before being sent to the browser or the LLM. */
const MAX_FILE_CHARS = 200_000;

export interface FileTreeEntry {
  path: string;
  type: string;
  size: number;
}

export interface FileContent {
  path: string;
  sha: string;
  size: number;
  content: string;
  truncated: boolean;
}

async function readTree(repositoryId: string): Promise<FileTreeEntry[]> {
  const files = await prisma.repositoryFile.findMany({
    where: { repositoryId },
    orderBy: { path: "asc" },
  });

  return files.map((file) => ({ path: file.path, type: file.type, size: file.size }));
}

/**
 * Returns the file tree for a connected repository, syncing it from GitHub on
 * first access so callers never see an empty explorer.
 */
export async function listFileTree(userId: string, owner: string, name: string): Promise<FileTreeEntry[]> {
  const repository = await getConnectedRepository(userId, owner, name);
  let tree = await readTree(repository.id);

  if (tree.length === 0) {
    await syncRepositoryFiles(userId, owner, name);
    tree = await readTree(repository.id);
  }

  return tree;
}

export async function getFileContent(userId: string, owner: string, name: string, path: string): Promise<FileContent> {
  const repository = await getConnectedRepository(userId, owner, name);
  const token = await getGitHubAccessToken(userId);
  const file = await githubClient.getFileContent(token, owner, name, path, repository.defaultBranch);

  const truncated = file.content.length > MAX_FILE_CHARS;

  return {
    path: file.path,
    sha: file.sha,
    size: file.size,
    content: truncated ? file.content.slice(0, MAX_FILE_CHARS) : file.content,
    truncated,
  };
}
