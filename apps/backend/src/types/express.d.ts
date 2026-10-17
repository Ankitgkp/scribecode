import type { GitHubAccount, Session, User } from "@/generated/prisma/client";

export interface AuthUser extends User {
  account: GitHubAccount | null;
}

/**
 * Authenticated request context, attached by the auth middleware.
 */
export interface AuthContext {
  user: AuthUser;
  session: Session;
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}

export {};
