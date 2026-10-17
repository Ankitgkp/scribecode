export interface GitHubRepositorySummary {
  id: string;
  owner: string;
  name: string;
  fullName: string;
  description: string | null;
  defaultBranch: string;
  language: string | null;
  isPrivate: boolean;
}

export interface ConnectedRepository {
  id: string;
  owner: string;
  name: string;
  fullName: string;
  description: string | null;
  defaultBranch: string;
  language: string | null;
  isPrivate: boolean;
  updatedAt: string;
}
