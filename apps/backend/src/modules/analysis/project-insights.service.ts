import { llm } from "@/lib/llm";
import { fromJsonInput, toJsonInput } from "@/lib/json";
import { prisma } from "@/lib/prisma";
import { listFileTree, type FileTreeEntry } from "@/modules/files/files.service";
import { getConnectedRepository } from "@/modules/repositories/repositories.service";
import type { Graph } from "@/types/graph";
import { projectInsightsSchema, type ProjectInsights } from "@/modules/analysis/analysis.schema";

const PROJECT_INSIGHTS_KIND = "project-insights";
const MAX_FILES_IN_PROMPT = 180;

export interface ProjectInsightsResult extends ProjectInsights {
  cached: boolean;
  limitedAnalysis: boolean;
}

function mockProjectInsights(tree: FileTreeEntry[]): ProjectInsights {
  const paths = tree.filter((entry) => entry.type === "blob").map((entry) => entry.path);
  const topLevel = [...new Set(paths.map((path) => path.split("/")[0] ?? "root"))].slice(0, 6);

  return {
    title: "Project tour",
    summary: "A repository overview generated from its file structure.",
    startHere: paths
      .slice(0, 3)
      .map((path) => ({ path, label: path.split("/").at(-1) ?? path, reason: "A useful place to begin exploring." })),
    modules: topLevel.map((directory) => ({
      id: directory,
      name: directory === "root" ? "Project files" : directory,
      kind: "feature",
      purpose: `Files grouped under ${directory}.`,
      paths: paths.filter((path) => path === directory || path.startsWith(`${directory}/`)).slice(0, 5),
      connectsTo: [],
    })),
    flows: [],
    integrations: [],
  };
}

function graphSummary(graph: Graph): string {
  const internal = graph.nodes.filter((node) => node.group !== "external");
  const packages = graph.nodes
    .filter((node) => node.group === "external")
    .map((node) => node.label)
    .slice(0, 12);

  return [
    `Parsed ${internal.length} source files and ${graph.edges.length} import relationships.`,
    packages.length > 0 ? `Detected packages: ${packages.join(", ")}.` : "No external packages were detected.",
  ].join(" ");
}

export async function analyzeProjectInsights(
  userId: string,
  owner: string,
  name: string,
  graph: Graph,
  options: { refresh: boolean },
): Promise<ProjectInsightsResult> {
  const repository = await getConnectedRepository(userId, owner, name);

  if (!options.refresh) {
    const cached = await prisma.analysis.findFirst({
      where: { repositoryId: repository.id, kind: PROJECT_INSIGHTS_KIND },
      orderBy: { createdAt: "desc" },
    });

    if (cached) {
      const insights = fromJsonInput<ProjectInsights>(cached.content);
      return { ...insights, cached: true, limitedAnalysis: graph.nodes.length === 0 };
    }
  }

  const tree = await listFileTree(userId, owner, name);
  const files = tree
    .filter((entry) => entry.type === "blob")
    .slice(0, MAX_FILES_IN_PROMPT)
    .map((entry) => entry.path)
    .join("\n");

  const insights = await llm.generateStructured<ProjectInsights>({
    schema: projectInsightsSchema,
    schemaName:
      "ProjectInsights { title, summary, startHere[{path,label,reason}], modules[{id,name,kind,purpose,paths,connectsTo}], flows[{id,name,description,steps}], integrations }",
    system:
      "You help a non-technical creator understand a project they built quickly. Be warm, concrete, and plain-English. Only reference paths supplied in the input. Do not generate HTML, markdown, or visual styling.",
    prompt: [
      `Create a guided project tour for ${owner}/${name}.`,
      "Make 3-6 modules when the repository has enough structure; otherwise use fewer.",
      "Module ids must be stable lowercase slugs. connectsTo must only contain module ids in this response.",
      "Describe 1-3 user-facing flows when they can be inferred. Each flow step is a short plain-English phrase.",
      "Choose up to five genuinely useful start-here files and explain why each matters.",
      "",
      graphSummary(graph),
      "",
      "Repository files:",
      files || "(No files found)",
    ].join("\n"),
    mockValue: mockProjectInsights(tree),
  });

  const knownPaths = new Set(tree.filter((entry) => entry.type === "blob").map((entry) => entry.path));
  const moduleIds = new Set(insights.modules.map((module) => module.id));
  const normalized: ProjectInsights = {
    title: insights.title.trim() || "Project tour",
    summary: insights.summary.trim(),
    startHere: insights.startHere.filter((item) => knownPaths.has(item.path)).slice(0, 5),
    modules: insights.modules.slice(0, 6).map((module) => ({
      ...module,
      id: module.id.trim(),
      name: module.name.trim(),
      purpose: module.purpose.trim(),
      paths: module.paths.filter((path) => knownPaths.has(path)).slice(0, 8),
      connectsTo: module.connectsTo.filter((id) => id !== module.id && moduleIds.has(id)).slice(0, 8),
    })),
    flows: insights.flows
      .slice(0, 3)
      .map((flow) => ({ ...flow, name: flow.name.trim(), description: flow.description.trim() })),
    integrations: [...new Set(insights.integrations.map((item) => item.trim()).filter(Boolean))].slice(0, 8),
  };

  await prisma.analysis.create({
    data: {
      repositoryId: repository.id,
      kind: PROJECT_INSIGHTS_KIND,
      model: llm.model,
      content: toJsonInput(normalized),
    },
  });

  return { ...normalized, cached: false, limitedAnalysis: graph.nodes.length === 0 };
}
