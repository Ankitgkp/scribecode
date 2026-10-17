import { z } from "zod";

export const healthQuerySchema = z.object({
  verbose: z
    .enum(["true", "false", "1", "0"])
    .optional()
    .transform((value) => value === "true" || value === "1"),
});

export type HealthQuery = z.infer<typeof healthQuerySchema>;
