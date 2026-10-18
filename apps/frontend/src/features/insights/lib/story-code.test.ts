import { describe, expect, it } from "vitest";
import { storyCodeExcerpt } from "@/features/insights/lib/story-code";
describe("key code excerpts", () => {
  it("chooses an important code block and preserves source line numbers", () => {
    const content = Array.from({ length: 30 }, (_, index) => `line ${index + 1}`).join("\n");
    const blocks = [
      { name: "Config", kind: "type", startLine: 1, endLine: 3, label: "Config", detail: "" },
      { name: "App", kind: "component", startLine: 10, endLine: 29, label: "App", detail: "" },
    ];
    const excerpt = storyCodeExcerpt(content, blocks, null);
    expect(excerpt.block?.name).toBe("App");
    expect(excerpt.lines).toHaveLength(10);
    expect(excerpt.lines[0]).toEqual({ number: 10, text: "line 10" });
    expect(storyCodeExcerpt(content, blocks, 0).lines).toHaveLength(3);
  });
});
