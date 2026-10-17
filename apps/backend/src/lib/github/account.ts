import { prisma } from "@/lib/prisma";
import { AppError } from "@/errors/app-error";

/**
 * Resolves the stored GitHub access token for a user.
 * Kept in the GitHub infrastructure layer so feature services never touch
 * credential storage directly.
 */
export async function getGitHubAccessToken(userId: string): Promise<string> {
  const account = await prisma.gitHubAccount.findUnique({ where: { userId } });

  if (!account) {
    throw AppError.badRequest("Connect a GitHub account to continue");
  }

  return account.accessToken;
}
