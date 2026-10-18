import "dotenv/config";

import { z } from "zod";

/** Treats empty or whitespace-only values as "not set". */
const emptyToUndefined = (value: unknown): unknown =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const optionalUrl = z.preprocess(emptyToUndefined, z.url().optional());
const optionalString = z.preprocess(emptyToUndefined, z.string().optional());

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().max(65_535).default(4000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  FRONTEND_URL: z.string().default("http://localhost:5173"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
  /** Enables the local-only pino-pretty transport. */
  LOG_PRETTY: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  APP_VERSION: z.string().default("0.1.0"),

  // Sessions (opaque tokens stored in the database, delivered via an httpOnly cookie).
  SESSION_COOKIE_NAME: z.string().default("scribe_session"),
  SESSION_TTL_HOURS: z.coerce.number().int().positive().default(720),

  // GitHub integration. Optional so the API boots without credentials;
  // the OAuth endpoints report a clear error when they are not configured.
  GITHUB_CLIENT_ID: optionalString,
  GITHUB_CLIENT_SECRET: optionalString,
  GITHUB_OAUTH_CALLBACK_URL: z.string().default("http://localhost:4000/api/v1/auth/github/callback"),
  GITHUB_SCOPES: z.string().default("read:user user:email repo"),

  // LLM integration (provider-agnostic, OpenAI-compatible endpoints).
  // Defaults to a deterministic mock so the app runs without an API key.
  LLM_PROVIDER: z.enum(["mock", "openai", "deepseek"]).default("mock"),
  /** Generic API key (used by the `openai` provider). */
  LLM_API_KEY: optionalString,
  /** DeepSeek-specific key; falls back to LLM_API_KEY when omitted. */
  DEEPSEEK_API_KEY: optionalString,
  /** Overrides the provider's default base URL. */
  LLM_BASE_URL: optionalUrl,
  /** Overrides the provider's default model. */
  LLM_MODEL: optionalString,
  LLM_MAX_TOKENS: z.coerce.number().int().positive().default(4096),
  /** Ask the provider for guaranteed-JSON output on structured calls. */
  LLM_JSON_MODE: z
    .enum(["true", "false"])
    .default("true")
    .transform((value) => value === "true"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("\n");

  console.error(`Invalid environment configuration:\n${issues}`);
  process.exit(1);
}

/**
 * Validated, typed access to the server configuration.
 * Fails fast at startup if required variables are missing or malformed.
 */
export const env = parsed.data;

export type Env = typeof env;

export const isProduction = env.NODE_ENV === "production";

export const corsOrigins = env.CORS_ORIGIN.split(",")
  .map((origin) => origin.trim())
  .filter((origin) => origin.length > 0);

export const githubOAuthConfigured = Boolean(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET);
