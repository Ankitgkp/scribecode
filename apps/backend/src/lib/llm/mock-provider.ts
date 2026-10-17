import type { GenerateStructuredInput, GenerateTextInput, LlmProvider } from "@/lib/llm/provider";

/**
 * Deterministic provider used in development and tests (and whenever no LLM
 * API key is configured). Keeps the app fully functional offline.
 */
export class MockLlmProvider implements LlmProvider {
  readonly name = "mock";
  readonly model = "mock";
  readonly isConfigured = true;

  async generateText(input: GenerateTextInput): Promise<string> {
    return `[mock-llm] ${input.prompt.slice(0, 200)}`;
  }

  async generateStructured<T>(input: GenerateStructuredInput<T>): Promise<T> {
    return input.mockValue;
  }
}
