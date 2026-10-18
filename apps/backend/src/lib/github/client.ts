import { Octokit } from "@octokit/rest";

import { AppError } from "@/errors/app-error";

export interface GitHubUser {
  id: string;
  login: string;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
}

export interface GitHubRepository {
  id: string;
  owner: string;
  name: string;
  fullName: string;
  description: string | null;
  defaultBranch: string;
  language: string | null;
  isPrivate: boolean;
}

export interface GitHubTreeEntry {
  path: string;
  sha: string;
  type: "blob" | "tree" | "commit";
  size: number;
}

export interface GitHubFile {
  path: string;
  sha: string;
  size: number;
  content: string;
}

export interface ListRepositoriesOptions {
  page?: number;
  perPage?: number;
}

function createClient(token: string): Octokit {
  return token ? new Octokit({ auth: token }) : new Octokit();
}

/**
 * Maps GitHub API failures onto operational AppErrors so the central error
 * handler can produce consistent responses.
 */
export function mapGitHubError(error: unknown, context: string): AppError {
  const status = (error as { status?: number }).status;
  const githubError = error as { message?: string; response?: { headers?: Record<string, string> } };
  const headers = githubError.response?.headers;
  const rateLimited =
    status === 429 ||
    (status === 403 &&
      (headers?.["x-ratelimit-remaining"] === "0" || /rate limit|secondary limit/i.test(githubError.message ?? "")));

  if (rateLimited) {
    return new AppError("GitHub's request limit was reached. Try again later or connect a GitHub account.", {
      statusCode: 429,
      code: "GITHUB_RATE_LIMITED",
    });
  }

  if (status === 401) {
    return new AppError(`GitHub authentication failed while ${context}`, {
      statusCode: 401,
      code: "GITHUB_UNAUTHORIZED",
    });
  }

  if (status === 403) {
    return new AppError(`GitHub denied access while ${context}`, {
      statusCode: 403,
      code: "GITHUB_FORBIDDEN",
    });
  }

  if (status === 404) {
    return AppError.notFound(`GitHub resource not found while ${context}`);
  }

  return new AppError(`GitHub request failed while ${context}`, {
    statusCode: 502,
    code: "GITHUB_REQUEST_FAILED",
    cause: error,
  });
}

export const githubClient = {
  async getAuthenticatedUser(token: string): Promise<GitHubUser> {
    const octokit = createClient(token);

    try {
      const { data } = await octokit.rest.users.getAuthenticated();
      return {
        id: String(data.id),
        login: data.login,
        name: data.name ?? null,
        email: data.email ?? null,
        avatarUrl: data.avatar_url ?? null,
      };
    } catch (error) {
      throw mapGitHubError(error, "fetching the authenticated user");
    }
  },

  async listRepositories(token: string, options: ListRepositoriesOptions = {}): Promise<GitHubRepository[]> {
    const octokit = createClient(token);
    const perPage = options.perPage ?? 30;
    const page = options.page ?? 1;

    try {
      const { data } = await octokit.rest.repos.listForAuthenticatedUser({
        per_page: perPage,
        page,
        sort: "updated",
        affiliation: "owner,collaborator,organization_member",
      });

      return data.map((repo) => ({
        id: String(repo.id),
        owner: repo.owner.login,
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description ?? null,
        defaultBranch: repo.default_branch,
        language: repo.language ?? null,
        isPrivate: repo.private,
      }));
    } catch (error) {
      throw mapGitHubError(error, "listing repositories");
    }
  },

  async getRepository(token: string, owner: string, repo: string): Promise<GitHubRepository> {
    const octokit = createClient(token);

    try {
      const { data } = await octokit.rest.repos.get({ owner, repo });
      return {
        id: String(data.id),
        owner: data.owner.login,
        name: data.name,
        fullName: data.full_name,
        description: data.description ?? null,
        defaultBranch: data.default_branch,
        language: data.language ?? null,
        isPrivate: data.private,
      };
    } catch (error) {
      throw mapGitHubError(error, `fetching repository ${owner}/${repo}`);
    }
  },

  async getTree(token: string, owner: string, repo: string, ref: string): Promise<GitHubTreeEntry[]> {
    const octokit = createClient(token);

    try {
      const { data } = await octokit.rest.git.getTree({
        owner,
        repo,
        tree_sha: ref,
        recursive: "true",
      });

      return data.tree
        .filter((entry): entry is typeof entry & { path: string; sha: string } => Boolean(entry.path && entry.sha))
        .map((entry) => ({
          path: entry.path,
          sha: entry.sha,
          type: entry.type === "tree" ? "tree" : "blob",
          size: entry.size ?? 0,
        }));
    } catch (error) {
      throw mapGitHubError(error, `fetching the tree for ${owner}/${repo}`);
    }
  },

  async getFileContent(token: string, owner: string, repo: string, path: string, ref?: string): Promise<GitHubFile> {
    const octokit = createClient(token);

    try {
      const { data } = await octokit.rest.repos.getContent({ owner, repo, path, ...(ref ? { ref } : {}) });

      if (Array.isArray(data) || data.type !== "file") {
        throw AppError.badRequest(`${path} is not a file`);
      }

      const content = data.encoding === "base64" ? Buffer.from(data.content, "base64").toString("utf8") : data.content;

      return { path: data.path, sha: data.sha, size: data.size, content };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw mapGitHubError(error, `fetching ${path} from ${owner}/${repo}`);
    }
  },
};

export type GitHubClient = typeof githubClient;
