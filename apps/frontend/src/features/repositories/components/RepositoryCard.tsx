import { GitHubRepoCard } from "@/components/socials/github-repo-card";
import type { ConnectedRepository } from "@/features/repositories/types";

export function RepositoryCard({ repository }: { repository: ConnectedRepository }) {
  return (
    <GitHubRepoCard
      owner={repository.owner}
      name={repository.name}
      description={repository.description}
      language={repository.language}
      defaultBranch={repository.defaultBranch}
      isPrivate={repository.isPrivate}
      href={`/repositories/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.name)}`}
    />
  );
}
