import { z } from "zod";

export const filePathQuerySchema = z.object({
  path: z.string().min(1).max(1000),
});

export type FilePathQuery = z.infer<typeof filePathQuerySchema>;
