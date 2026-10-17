import type { ZodType } from "zod";

export interface GenerateTextInput {
  prompt: string;
  system?: string;
}

export interface GenerateStructuredInput<T> {
  prompt: string;
  system?: string;
  schema: ZodType<T>;
  schemaName: string;
  /**
   * Value returned by the mock provider. Required so every structured call
   * defines a sensible output when no real model is configured.
   */
  mockValue: T;
}

/**
 * Provider-agnostic LLM contract. Implementations may target any
 * OpenAI-compatible endpoint, or be replaced with a different vendor.
 */
export interface LlmProvider {
  readonly name: string;
  readonly model: string;
  readonly isConfigured: boolean;
  generateText(input: GenerateTextInput): Promise<string>;
  generateStructured<T>(input: GenerateStructuredInput<T>): Promise<T>;
}
