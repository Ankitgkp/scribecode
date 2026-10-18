import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useInterviewPreload } from "@/features/insights/hooks/useInterviewPreload";
import { clearAsyncResourceCache } from "@/hooks/useAsyncResource";

const mocks = vi.hoisted(() => ({ analysis: vi.fn(), content: vi.fn() }));
vi.mock("@/features/analysis/api", () => ({ fetchFileAnalysis: mocks.analysis }));
vi.mock("@/features/explorer/api", () => ({ fetchFileContent: mocks.content }));
const stops = Array.from({ length: 8 }, (_, index) => ({
  path: `src/chapter${index}.ts`,
  chapter: "App",
  from: null,
  readable: true,
}));
beforeEach(() => {
  clearAsyncResourceCache();
  vi.clearAllMocks();
  mocks.analysis.mockResolvedValue({ purpose: "Chapter" });
  mocks.content.mockResolvedValue({ content: "code" });
});
describe("bounded interview preloading", () => {
  it("warms only the two opening chapters before the story begins", async () => {
    renderHook(() => useInterviewPreload("demo", "app", stops, 0, false));
    await waitFor(() => expect(mocks.analysis).toHaveBeenCalledTimes(2));
    expect(mocks.analysis.mock.calls.map((call) => call[2])).toEqual(["src/chapter0.ts", "src/chapter1.ts"]);
  });
  it("preloads the current and next two chapters and reuses warmed chapters", async () => {
    const { rerender } = renderHook(({ index }) => useInterviewPreload("demo", "app", stops, index, true), {
      initialProps: { index: 0 },
    });
    await waitFor(() => expect(mocks.analysis).toHaveBeenCalledTimes(3));
    rerender({ index: 1 });
    await waitFor(() => expect(mocks.analysis).toHaveBeenCalledTimes(4));
    expect(mocks.analysis.mock.calls.map((call) => call[2])).toEqual([
      "src/chapter0.ts",
      "src/chapter1.ts",
      "src/chapter2.ts",
      "src/chapter3.ts",
    ]);
  });
});
