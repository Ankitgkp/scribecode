import { z, type ZodType } from "zod";

import { AppError } from "@/errors/app-error";
import type { GenerateStructuredInput, GenerateTextInput, LlmProvider } from "@/lib/llm/provider";

interface OpenAiCompatibleConfig {
  /** Provider name surfaced through `LlmProvider.name` (e.g. "deepseek"). */
  name: string;
  apiKey: string;
  baseUrl: string;
  model: string;
  maxTokens?: number;
  /** Request guaranteed-JSON output for structured calls (default: true). */
  jsonMode?: boolean;
}

interface ChatCompletionResponse {
  choices?: Array<{ message?: { content?: string | null } }>;
}

function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced?.[1] ?? text).trim();
  const start = candidate.indexOf("{");
  const endCandidate = candidate.lastIndexOf("}");

  if (start >= 0 && endCandidate > start) {
    return candidate.slice(start, endCandidate + 1);
  }

  return candidate;
}

/**
 * Renders a Zod schema as a JSON Schema so the model knows the exact shape to
 * produce. Without this the model only sees the schema *name* and is free to
 * omit fields. Falls back to an empty string for schemas that cannot be
 * represented (the caller still gets the name-based instruction).
 */
function describeSchema(schema: ZodType): string {
  try {
    return JSON.stringify(z.toJSONSchema(schema));
  } catch {
    return "";
  }
}

/**
 * Adapter for any OpenAI-compatible chat completions endpoint.
 * Covers OpenAI, DeepSeek, and compatible gateways.
 */
export class OpenAiCompatibleProvider implements LlmProvider {
  readonly name: string;
  readonly model: string;
  readonly isConfigured = true;

  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly maxTokens: number | undefined;
  private readonly jsonMode: boolean;

  constructor(config: OpenAiCompatibleConfig) {
    this.name = config.name;
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl.replace(/\/+$/, "");
    this.model = config.model;
    this.maxTokens = config.maxTokens;
    this.jsonMode = config.jsonMode ?? true;
  }

  async generateText(input: GenerateTextInput): Promise<string> {
    return this.complete(input, false);
  }

  async generateStructured<T>(input: GenerateStructuredInput<T>): Promise<T> {
    const shape = describeSchema(input.schema);

    const system = [
      input.system,
      `Respond with a single JSON object that matches the "${input.schemaName}" schema.`,
      shape ? `The JSON Schema is: ${shape}` : undefined,
      "Every required field must be present. Return valid json only — no commentary and no markdown fences.",
    ]
      .filter(Boolean)
      .join("\n");

    const text = await this.complete({ system, prompt: input.prompt }, this.jsonMode);

    try {
      return input.schema.parse(JSON.parse(extractJson(text)));
    } catch (error) {
      throw new AppError("LLM returned an unexpected response shape", {
        statusCode: 502,
        code: "LLM_INVALID_RESPONSE",
        cause: error,
      });
    }
  }

  private async complete(input: GenerateTextInput, jsonMode: boolean): Promise<string> {
    const messages = [
      ...(input.system ? [{ role: "system" as const, content: input.system }] : []),
      { role: "user" as const, content: input.prompt },
    ];

    const body: Record<string, unknown> = {
      model: this.model,
      messages,
      temperature: 0.2,
    };

    if (this.maxTokens !== undefined) {
      body.max_tokens = this.maxTokens;
    }

    if (jsonMode) {
      body.response_format = { type: "json_object" };
    }

    let response: Response;

    try {
      response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
      });
    } catch (error) {
      throw new AppError("Failed to reach the LLM provider", {
        statusCode: 502,
        code: "LLM_UNREACHABLE",
        cause: error,
      });
    }

    if (!response.ok) {
      const detail = await response.text().catch(() => "");

      throw new AppError(`LLM provider returned ${response.status}`, {
        statusCode: 502,
        code: "LLM_REQUEST_FAILED",
        details: detail.slice(0, 500),
      });
    }

    const data = (await response.json()) as ChatCompletionResponse;
    const content = data.choices?.[0]?.message?.content ?? "";

    if (content.trim().length === 0) {
      throw new AppError("LLM provider returned an empty response", {
        statusCode: 502,
        code: "LLM_EMPTY_RESPONSE",
      });
    }

    return content;
  }
}
