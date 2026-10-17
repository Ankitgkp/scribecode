import { z } from "zod";

export const dependencyGraphQuerySchema = z.object({
  /** Maximum number of source files to analyze (bounds the number of GitHub requests). */
  limit: z.coerce.number().int().positive().max(300).optional().default(60),
  /** Rebuild the graph instead of returning the cached one. */
  refresh: z
    .enum(["true", "false"])
    .optional()
    .default("false")
    .transform((value) => value === "true"),
});

export type DependencyGraphQuery = z.infer<typeof dependencyGraphQuerySchema>;
