import { z } from "zod";

export const listGitHubRepositoriesQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  perPage: z.coerce.number().int().positive().max(100).optional().default(30),
});

export type ListGitHubRepositoriesQuery = z.infer<typeof listGitHubRepositoriesQuerySchema>;

export const connectRepositorySchema = z.object({
  owner: z.string().min(1).max(200),
  name: z.string().min(1).max(200),
});

export type ConnectRepositoryInput = z.infer<typeof connectRepositorySchema>;

export { repositoryParamsSchema, type RepositoryParams } from "@/schemas/repository-params";
