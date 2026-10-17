import { env, type Env } from "@/config/env";
import { logger } from "@/config/logger";
import { MockLlmProvider } from "@/lib/llm/mock-provider";
import { OpenAiCompatibleProvider } from "@/lib/llm/openai-provider";
import type { LlmProvider } from "@/lib/llm/provider";

export type { LlmProvider } from "@/lib/llm/provider";

type RemoteProvider = Exclude<Env["LLM_PROVIDER"], "mock">;

interface ProviderDefaults {
  baseUrl: string;
  model: string;
}

/**
 * Sensible defaults per provider. `LLM_BASE_URL` / `LLM_MODEL` override these,
 * so a new OpenAI-compatible vendor only needs an entry here.
 *
 * DeepSeek defaults to `deepseek-chat` (its fast, low-cost model); switch to
 * `deepseek-reasoner` via LLM_MODEL when deeper reasoning is worth the cost.
 */
const PROVIDER_DEFAULTS: Record<RemoteProvider, ProviderDefaults> = {
  openai: { baseUrl: "https://api.openai.com/v1", model: "gpt-4o-mini" },
  deepseek: { baseUrl: "https://api.deepseek.com", model: "deepseek-chat" },
};

function resolveApiKey(provider: RemoteProvider): string | undefined {
  if (provider === "deepseek") {
    return env.DEEPSEEK_API_KEY ?? env.LLM_API_KEY;
  }

  return env.LLM_API_KEY;
}

function createLlmProvider(): LlmProvider {
  const provider = env.LLM_PROVIDER;

  if (provider === "mock") {
    return new MockLlmProvider();
  }

  const apiKey = resolveApiKey(provider);

  if (!apiKey) {
    logger.warn(
      `LLM_PROVIDER is "${provider}" but no API key is configured ` +
        `(set DEEPSEEK_API_KEY or LLM_API_KEY); falling back to the mock provider`,
    );
    return new MockLlmProvider();
  }

  const defaults = PROVIDER_DEFAULTS[provider];

  return new OpenAiCompatibleProvider({
    name: provider,
    apiKey,
    baseUrl: env.LLM_BASE_URL ?? defaults.baseUrl,
    model: env.LLM_MODEL ?? defaults.model,
    maxTokens: env.LLM_MAX_TOKENS,
    jsonMode: env.LLM_JSON_MODE,
  });
}

export const llm: LlmProvider = createLlmProvider();

logger.info({ provider: llm.name, model: llm.model }, "LLM provider ready");
