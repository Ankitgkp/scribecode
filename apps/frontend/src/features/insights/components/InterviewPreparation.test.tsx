import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { InterviewPreparation } from "@/features/insights/components/InterviewPreparation";
import { FileConnectionsMap } from "@/features/insights/components/FileConnectionsMap";
import { REPOSITORY_FILE_DRAG_TYPE } from "@/features/insights/lib/interview-story";
import type { ProjectInsights } from "@/features/insights/types";

const mocks = vi.hoisted(() => ({ ask: vi.fn(), analyze: vi.fn() }));
vi.mock("@/features/insights/api", () => ({ askInterviewQuestion: mocks.ask }));
vi.mock("@/features/analysis/hooks/useFileAnalysis", () => ({ useFileAnalysis: mocks.analyze }));
vi.mock("@/features/insights/hooks/useInterviewPreload", () => ({ useInterviewPreload: vi.fn() }));
vi.mock("@/features/explorer/hooks/useFileContent", () => ({
  useFileContent: () => ({
    status: "success",
    data: { content: 'import App from "./App";\ncreateRoot(root).render(<App />);' },
    error: null,
  }),
}));
const insights: ProjectInsights = {
  title: "App",
  summary: "An app",
  modules: [],
  startHere: [],
  flows: [],
  integrations: [],
  cached: true,
  limitedAnalysis: false,
};
const graph = {
  nodes: [
    { id: "src/main.tsx", label: "main.tsx" },
    { id: "src/App.tsx", label: "App.tsx" },
    { id: "npm:react", label: "react", group: "external" },
  ],
  edges: [
    { source: "src/main.tsx", target: "src/App.tsx" },
    { source: "src/main.tsx", target: "npm:react" },
  ],
};
function Story() {
  const [path, setPath] = useState("");
  return (
    <InterviewPreparation
      owner="demo"
      name="app"
      insights={insights}
      graph={graph}
      tree={graph.nodes
        .filter((node) => !node.id.startsWith("npm:"))
        .map((node) => ({ path: node.id, type: "blob", size: 10 }))}
      status="success"
      error={null}
      selectedPath={path}
      onSelectFile={setPath}
      onExploreFile={vi.fn()}
    />
  );
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.analyze.mockReturnValue({
    status: "success",
    data: {
      purpose: "Starts the app and renders its interface.",
      highlights: ["Mounts the React root"],
      blocks: [],
      dependencies: [],
      cached: true,
    },
    error: null,
    reload: vi.fn(),
  });
});
describe("interview story", () => {
  it("starts on demand, reveals speaking notes, and moves through connected files", () => {
    render(<Story />);
    expect(mocks.analyze).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: /start my story/i }));
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("1");
    expect(screen.getByRole("region", { name: "Key code" })).toBeDefined();
    expect(screen.queryByRole("textbox", { name: "Ask your interview coach" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Speaking notes" }));
    expect(screen.getByRole("dialog", { name: "Speaking notes" })).toBeDefined();
    expect(screen.getByText(/It imports App.tsx/)).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Close chapter details" }));
    fireEvent.click(screen.getByRole("button", { name: "I practiced explaining this stop" }));
    expect(screen.getByRole("button", { name: /Practiced — nice work/ }).getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "Next chapter" }));
    expect(screen.getByRole("combobox").getAttribute("aria-label")).toBe("Jump to a story file");
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("2");
  });
  it("answers a question within the current slide and keeps the story available", async () => {
    mocks.ask.mockResolvedValue({
      answer: "The entry mounts the application root.",
      points: [],
      evidence: [{ path: "src/main.tsx", note: "Creates the React root." }],
      followUpQuestions: [],
      cached: false,
    });
    render(<Story />);
    fireEvent.click(screen.getByRole("button", { name: /start my story/i }));
    fireEvent.click(screen.getByRole("button", { name: "Ask coach" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Ask your interview coach" }), {
      target: { value: "Where does the app start?" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Ask question" }));
    await waitFor(() => expect(screen.getByText("The entry mounts the application root.")).toBeDefined());
    expect(mocks.ask).toHaveBeenCalledWith(
      "demo",
      "app",
      "src/main.tsx",
      "Where does the app start?",
      expect.any(AbortSignal),
    );
    expect(screen.getByRole("button", { name: "Next chapter" })).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Close chapter details" }));
    fireEvent.click(screen.getByRole("button", { name: "Ask coach" }));
    expect(screen.getByText("The entry mounts the application root.")).toBeDefined();
    expect(mocks.ask).toHaveBeenCalledOnce();
  });
  it("changes one chapter per scroll gesture and supports arrow-key navigation", () => {
    render(<Story />);
    fireEvent.click(screen.getByRole("button", { name: /start my story/i }));
    const slides = screen.getByLabelText("Interview story slides");
    fireEvent.wheel(slides, { deltaY: 130 });
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("2");
    fireEvent.wheel(slides, { deltaY: 130 });
    expect(screen.queryByText("That’s your project story.")).toBeNull();
    fireEvent.keyDown(slides, { key: "ArrowLeft" });
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("1");
  });
});
describe("file map drop", () => {
  it("focuses a known dropped repository file, including files not in the parsed graph", () => {
    const focus = vi.fn();
    render(
      <FileConnectionsMap
        graph={graph}
        selectedPath="src/main.tsx"
        filePaths={["README.md"]}
        onFocusFile={focus}
        onSelectFile={vi.fn()}
      />,
    );
    fireEvent.drop(screen.getByRole("region", { name: "File connections map" }), {
      dataTransfer: { getData: (type: string) => (type === REPOSITORY_FILE_DRAG_TYPE ? "README.md" : "") },
    });
    expect(focus).toHaveBeenCalledWith("README.md");
    expect(screen.getByRole("heading", { name: "README.md" })).toBeDefined();
  });
  it("rejects files from outside the repository", () => {
    const focus = vi.fn();
    render(<FileConnectionsMap graph={graph} selectedPath="src/main.tsx" onFocusFile={focus} onSelectFile={vi.fn()} />);
    fireEvent.drop(screen.getByRole("region", { name: "File connections map" }), {
      dataTransfer: { getData: () => "outside.ts" },
    });
    expect(focus).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toBeDefined();
  });
});
