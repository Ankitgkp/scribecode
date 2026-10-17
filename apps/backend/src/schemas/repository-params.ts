import { z } from "zod";

/**
 * Shared route params for endpoints scoped to a connected repository
 * (`/:owner/:name`). Owned here so every feature module validates them
 * identically.
 */
export const repositoryParamsSchema = z.object({
  owner: z.string().min(1).max(200),
  name: z.string().min(1).max(200),
});

export type RepositoryParams = z.infer<typeof repositoryParamsSchema>;
