import { afterEach, describe, expect, it, vi } from "vitest";

interface ProviderStubs {
  LLM_PROVIDER: string;
  DEEPSEEK_API_KEY?: string;
  LLM_API_KEY?: string;
  LLM_MODEL?: string;
}

/** Reloads `@/lib/llm` with a controlled environment so the factory re-runs. */
async function loadProvider(stubs: ProviderStubs) {
  vi.resetModules();

  vi.stubEnv("LLM_PROVIDER", stubs.LLM_PROVIDER);
  vi.stubEnv("DEEPSEEK_API_KEY", stubs.DEEPSEEK_API_KEY ?? "");
  vi.stubEnv("LLM_API_KEY", stubs.LLM_API_KEY ?? "");
  vi.stubEnv("LLM_BASE_URL", "");
  vi.stubEnv("LLM_MODEL", stubs.LLM_MODEL ?? "");

  const module = await import("@/lib/llm");
  return module.llm;
}

describe("LLM provider factory", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("uses the mock provider by default", async () => {
    const llm = await loadProvider({ LLM_PROVIDER: "mock" });

    expect(llm.name).toBe("mock");
  });

  it("selects DeepSeek with the low-cost chat model by default", async () => {
    const llm = await loadProvider({ LLM_PROVIDER: "deepseek", DEEPSEEK_API_KEY: "test-key" });

    expect(llm.name).toBe("deepseek");
    expect(llm.model).toBe("deepseek-chat");
  });

  it("honours an explicit model override", async () => {
    const llm = await loadProvider({
      LLM_PROVIDER: "deepseek",
      DEEPSEEK_API_KEY: "test-key",
      LLM_MODEL: "deepseek-reasoner",
    });

    expect(llm.model).toBe("deepseek-reasoner");
  });

  it("accepts the generic API key as a DeepSeek fallback", async () => {
    const llm = await loadProvider({ LLM_PROVIDER: "deepseek", LLM_API_KEY: "generic-key" });

    expect(llm.name).toBe("deepseek");
  });

  it("falls back to the mock provider when no key is configured", async () => {
    const llm = await loadProvider({ LLM_PROVIDER: "deepseek" });

    expect(llm.name).toBe("mock");
  });
});
