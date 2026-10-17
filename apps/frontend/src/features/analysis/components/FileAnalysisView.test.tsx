import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FileAnalysisView } from "@/features/analysis/components/FileAnalysisView";

const filePayload = {
  path: "src/util.ts",
  sha: "sha",
  size: 60,
  truncated: false,
  content: ["export function add(a: number, b: number) {", "  return a + b;", "}"].join("\n"),
};

const analysisPayload = {
  purpose: "Small arithmetic helpers.",
  highlights: ["Exports add()"],
  dependencies: ["math"],
  cached: false,
  blocks: [
    {
      name: "add",
      kind: "function",
      startLine: 1,
      endLine: 3,
      label: "Adds two numbers",
      detail: "Returns the sum of a and b.",
    },
  ],
};

function stubFetch() {
  vi.stubGlobal(
    "fetch",
    vi.fn((input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      const data = url.includes("/analysis/") ? { analysis: analysisPayload } : { file: filePayload };

      return Promise.resolve({ ok: true, status: 200, json: async () => ({ success: true, data }) });
    }),
  );
}

describe("FileAnalysisView", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("leads with the explanation and annotates the code", async () => {
    stubFetch();

    render(<FileAnalysisView owner="acme" name="app" path="src/util.ts" />);

    expect(await screen.findByText("Small arithmetic helpers.")).toBeInTheDocument();
    expect(await screen.findByText("Exports add()")).toBeInTheDocument();
    expect(await screen.findByText("Adds two numbers")).toBeInTheDocument();
  });

  it("reveals the full explanation behind 'More detail'", async () => {
    stubFetch();

    render(<FileAnalysisView owner="acme" name="app" path="src/util.ts" />);

    fireEvent.click(await screen.findByText("More detail"));

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Returns the sum of a and b.")).toBeInTheDocument();
  });

  it("keeps the raw source one toggle away", async () => {
    stubFetch();

    render(<FileAnalysisView owner="acme" name="app" path="src/util.ts" />);

    expect(await screen.findByText("Adds two numbers")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "Raw code" }));

    expect(screen.queryByText("Adds two numbers")).not.toBeInTheDocument();
  });
});
