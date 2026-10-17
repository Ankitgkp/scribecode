import { AppError } from "@/errors/app-error";
import type { GitHubUser } from "@/lib/github/client";
import { prisma } from "@/lib/prisma";
import { env } from "@/config/env";
import { generateOpaqueToken } from "@/modules/auth/auth.cookies";

export interface CreatedSession {
  token: string;
  expiresAt: Date;
}

export async function createSession(userId: string): Promise<CreatedSession> {
  const token = generateOpaqueToken();
  const expiresAt = new Date(Date.now() + env.SESSION_TTL_HOURS * 60 * 60 * 1000);

  await prisma.session.create({ data: { token, userId, expiresAt } });

  return { token, expiresAt };
}

export async function findValidSession(token: string) {
  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: { include: { account: true } } },
  });

  if (!session) {
    return null;
  }

  if (session.expiresAt.getTime() <= Date.now()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }

  return session;
}

export async function revokeSession(token: string): Promise<void> {
  await prisma.session.deleteMany({ where: { token } });
}

export async function upsertUserFromGitHub(github: GitHubUser, accessToken: string, scopes?: string | null) {
  const user = await prisma.user.upsert({
    where: { login: github.login },
    create: {
      login: github.login,
      name: github.name,
      email: github.email,
      avatarUrl: github.avatarUrl,
    },
    update: {
      name: github.name,
      email: github.email,
      avatarUrl: github.avatarUrl,
    },
  });

  await prisma.gitHubAccount.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      githubUserId: github.id,
      accessToken,
      scopes: scopes ?? null,
    },
    update: {
      githubUserId: github.id,
      accessToken,
      scopes: scopes ?? null,
    },
  });

  const withAccount = await prisma.user.findUnique({
    where: { id: user.id },
    include: { account: true },
  });

  if (!withAccount) {
    throw AppError.notFound("User not found after connecting GitHub");
  }

  return withAccount;
}
