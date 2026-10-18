import type { RequestHandler } from "express";

import { AppError } from "@/errors/app-error";
import { githubClient } from "@/lib/github/client";
import { prisma } from "@/lib/prisma";
import { optionalAuth } from "@/middleware/auth";

export const PUBLIC_REPOSITORY_USER_ID = "scribecode-public-repositories";

/** Public imports share one cache. Only repositories confirmed public by GitHub enter it. */
export async function openRepository(owner: string, name: string, userId?: string) {
  const account = userId ? await prisma.gitHubAccount.findUnique({ where: { userId } }) : null;
  const repository = await githubClient.getRepository(account?.accessToken ?? "", owner, name);
  if (repository.isPrivate && !userId) {
    throw AppError.notFound("This repository is private. Connect GitHub to access it.");
  }

  const targetUserId = userId ?? PUBLIC_REPOSITORY_USER_ID;
  if (!userId) {
    await prisma.user.upsert({
      where: { id: PUBLIC_REPOSITORY_USER_ID },
      create: { id: PUBLIC_REPOSITORY_USER_ID, login: "__scribecode_public_repositories__" },
      update: {},
    });
  }

  return prisma.repository.upsert({
    where: { userId_githubId: { userId: targetUserId, githubId: BigInt(repository.id) } },
    create: {
      userId: targetUserId,
      githubId: BigInt(repository.id),
      owner: repository.owner,
      name: repository.name,
      fullName: repository.fullName,
      description: repository.description,
      defaultBranch: repository.defaultBranch,
      language: repository.language,
      isPrivate: repository.isPrivate,
    },
    update: {
      owner: repository.owner,
      name: repository.name,
      fullName: repository.fullName,
      description: repository.description,
      defaultBranch: repository.defaultBranch,
      language: repository.language,
      isPrivate: repository.isPrivate,
    },
  });
}

/** Resolves a connected repository first, then a previously opened public repo. */
export const requireRepositoryAccess: RequestHandler[] = [
  optionalAuth,
  async (req, _res, next) => {
    const owner = String(req.params.owner ?? "");
    const name = String(req.params.name ?? "");
    const userId = req.auth?.user.id;

    try {
      if (userId) {
        const own = await prisma.repository.findFirst({ where: { userId, owner, name } });
        if (own) {
          req.repositoryUserId = userId;
          next();
          return;
        }
      }

      const publicRepository = await prisma.repository.findFirst({
        where: { userId: PUBLIC_REPOSITORY_USER_ID, owner, name, isPrivate: false },
      });
      if (publicRepository) {
        if (userId) {
          // A signed-in visitor can use their own GitHub allowance even when
          // the repository was first opened in the public workspace.
          await prisma.repository.upsert({
            where: { userId_githubId: { userId, githubId: publicRepository.githubId } },
            create: {
              userId,
              githubId: publicRepository.githubId,
              owner: publicRepository.owner,
              name: publicRepository.name,
              fullName: publicRepository.fullName,
              description: publicRepository.description,
              defaultBranch: publicRepository.defaultBranch,
              language: publicRepository.language,
              isPrivate: false,
            },
            update: { owner: publicRepository.owner, name: publicRepository.name },
          });
          req.repositoryUserId = userId;
          next();
          return;
        }
        req.repositoryUserId = PUBLIC_REPOSITORY_USER_ID;
        next();
        return;
      }

      next(
        userId
          ? AppError.notFound(`Repository ${owner}/${name} is not open yet`)
          : new AppError("Paste a public GitHub repository URL to get started", {
              statusCode: 401,
              code: "UNAUTHENTICATED",
            }),
      );
    } catch (error) {
      next(error);
    }
  },
];
