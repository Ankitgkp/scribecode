import type { Repository } from "@/generated/prisma/client";

export interface RepositoryDto {
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

/**
 * Maps a repository record to a JSON-safe DTO.
 * (The Prisma model uses BigInt for the GitHub id, which JSON.stringify cannot encode.)
 */
export function toRepositoryDto(repository: Repository): RepositoryDto {
  return {
    id: repository.id,
    owner: repository.owner,
    name: repository.name,
    fullName: repository.fullName,
    description: repository.description,
    defaultBranch: repository.defaultBranch,
    language: repository.language,
    isPrivate: repository.isPrivate,
    updatedAt: repository.updatedAt.toISOString(),
  };
}
