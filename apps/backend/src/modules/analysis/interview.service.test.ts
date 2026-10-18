import { beforeEach, describe, expect, it, vi } from "vitest";
import { interviewQuestionSchema } from "@/modules/analysis/analysis.schema";

const mocks = vi.hoisted(() => ({
  find: vi.fn(),
  create: vi.fn(),
  entry: vi.fn(),
  repo: vi.fn(),
  file: vi.fn(),
  generate: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({
  prisma: { analysis: { findFirst: mocks.find, create: mocks.create }, repositoryFile: { findUnique: mocks.entry } },
}));
vi.mock("@/lib/llm", () => ({ llm: { model: "mock", generateStructured: mocks.generate } }));
vi.mock("@/modules/files/files.service", () => ({ getFileContent: mocks.file }));
vi.mock("@/modules/repositories/repositories.service", () => ({ getConnectedRepository: mocks.repo }));
const { answerInterviewQuestion, interviewContextPaths } = await import("@/modules/analysis/interview.service");
const answer = {
  answer: "Starts the interface.",
  points: [],
  evidence: [
    { path: "src/main.tsx", note: "Mounts the root." },
    { path: "invented.ts", note: "Not real." },
  ],
  followUpQuestions: [],
};
const input = { path: "src/main.tsx", question: "Where does the app start?" };
beforeEach(() => {
  vi.clearAllMocks();
  mocks.repo.mockResolvedValue({ id: "repo-1" });
  mocks.entry.mockResolvedValue({ sha: "blob-1", type: "blob" });
  mocks.find.mockResolvedValue(null);
  mocks.file.mockResolvedValue({ path: "src/main.tsx", content: "createRoot(root).render(<App />)", truncated: false });
  mocks.generate.mockResolvedValue(answer);
});
describe("interview answers", () => {
  it("retrieves question-relevant project files beyond the current file’s neighbors", () => {
    const paths = interviewContextPaths(
      { path: "src/main.tsx", question: "How does authentication work?" },
      {
        nodes: [
          { id: "src/auth.ts", label: "auth.ts" },
          { id: "npm:react", label: "react", group: "external" },
        ],
        edges: [],
      },
      {
        title: "App",
        summary: "An app",
        startHere: [],
        flows: [],
        integrations: [],
        modules: [
          {
            id: "auth",
            name: "Authentication",
            kind: "feature",
            purpose: "Handles authentication and sessions.",
            paths: ["src/auth.ts"],
            connectsTo: [],
          },
        ],
      },
    );
    expect(paths).toEqual(["src/auth.ts"]);
  });
  it("reuses saved answers without a model or source request", async () => {
    mocks.find.mockResolvedValue({ content: answer });
    expect(await answerInterviewQuestion("u", "demo", "app", input)).toMatchObject({ cached: true });
    expect(mocks.generate).not.toHaveBeenCalled();
    expect(mocks.file).not.toHaveBeenCalled();
  });
  it("grounds the prompt in source and removes invented evidence paths", async () => {
    const result = await answerInterviewQuestion("u", "demo", "app", input);
    expect(result.evidence).toEqual([answer.evidence[0]]);
    expect(mocks.generate).toHaveBeenCalledWith(
      expect.objectContaining({ prompt: expect.stringContaining("createRoot") }),
    );
    expect(mocks.create).toHaveBeenCalledOnce();
  });
  it("coalesces duplicate in-flight questions", async () => {
    await Promise.all([
      answerInterviewQuestion("u", "demo", "app", input),
      answerInterviewQuestion("u", "demo", "app", input),
    ]);
    expect(mocks.generate).toHaveBeenCalledOnce();
  });
  it("rejects a file outside the synced repository before generating", async () => {
    mocks.entry.mockResolvedValue(null);
    await expect(answerInterviewQuestion("u", "demo", "app", input)).rejects.toThrow("Choose a file");
    expect(mocks.generate).not.toHaveBeenCalled();
  });
  it("bounds question input", () => {
    expect(interviewQuestionSchema.safeParse({ ...input, question: "  " }).success).toBe(false);
    expect(interviewQuestionSchema.safeParse({ ...input, question: "x".repeat(1201) }).success).toBe(false);
  });
});
