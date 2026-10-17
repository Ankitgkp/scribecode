import { z } from "zod";

export const connectPatSchema = z.object({
  token: z
    .string()
    .min(20, "That does not look like a GitHub personal access token")
    .max(500, "Token is too long")
    .trim(),
});

export type ConnectPatInput = z.infer<typeof connectPatSchema>;

export const oauthCallbackSchema = z.object({
  code: z.string().min(1),
  state: z.string().min(1),
});

export type OAuthCallbackInput = z.infer<typeof oauthCallbackSchema>;
