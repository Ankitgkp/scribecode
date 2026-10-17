import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { OpenAiCompatibleProvider } from "@/lib/llm/openai-provider";

const summarySchema = z.object({ summary: z.string() });

function createProvider() {
  return new OpenAiCompatibleProvider({
    name: "deepseek",
    apiKey: "test-key",
    baseUrl: "https://api.deepseek.com/",
    model: "deepseek-chat",
    maxTokens: 2048,
    jsonMode: true,
  });
}

function stubFetch(body: unknown, status = 200) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  });

  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function lastBody(fetchMock: ReturnType<typeof vi.fn>): Record<string, unknown> {
  const calls = fetchMock.mock.calls as Array<[string, RequestInit]>;
  const init = calls[0]?.[1];
  return JSON.parse(String(init?.body)) as Record<string, unknown>;
}

describe("OpenAiCompatibleProvider", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts to the provider endpoint with the configured model and token limit", async () => {
    const fetchMock = stubFetch({ choices: [{ message: { content: "hello" } }] });

    const result = await createProvider().generateText({ prompt: "hi" });

    expect(result).toBe("hello");

    const calls = fetchMock.mock.calls as Array<[string, RequestInit]>;
    expect(calls[0]?.[0]).toBe("https://api.deepseek.com/chat/completions");

    const body = lastBody(fetchMock);
    expect(body).toMatchObject({ model: "deepseek-chat", max_tokens: 2048 });
    expect(body.response_format).toBeUndefined();
  });

  it("requests JSON mode and parses fenced structured output", async () => {
    const fetchMock = stubFetch({
      choices: [{ message: { content: '```json\n{"summary":"ok"}\n```' } }],
    });

    const result = await createProvider().generateStructured({
      prompt: "explain",
      schema: summarySchema,
      schemaName: "Summary",
      mockValue: { summary: "mock" },
    });

    expect(result).toEqual({ summary: "ok" });
    expect(lastBody(fetchMock).response_format).toEqual({ type: "json_object" });
  });

  it("includes the JSON Schema so the model knows the required fields", async () => {
    const fetchMock = stubFetch({ choices: [{ message: { content: '{"summary":"ok"}' } }] });

    await createProvider().generateStructured({
      prompt: "explain",
      schema: summarySchema,
      schemaName: "Summary",
      mockValue: { summary: "mock" },
    });

    const messages = lastBody(fetchMock).messages as Array<{ role: string; content: string }>;
    const system = messages.find((message) => message.role === "system");

    expect(system?.content).toContain('"summary"');
    expect(system?.content).toContain("Summary");
  });

  it("throws a typed error when the model returns unparseable output", async () => {
    stubFetch({ choices: [{ message: { content: "not json at all" } }] });

    await expect(
      createProvider().generateStructured({
        prompt: "explain",
        schema: summarySchema,
        schemaName: "Summary",
        mockValue: { summary: "mock" },
      }),
    ).rejects.toMatchObject({ code: "LLM_INVALID_RESPONSE" });
  });

  it("surfaces provider failures as an operational error", async () => {
    stubFetch({ error: "unauthorized" }, 401);

    await expect(createProvider().generateText({ prompt: "hi" })).rejects.toMatchObject({
      code: "LLM_REQUEST_FAILED",
      statusCode: 502,
    });
  });
});
