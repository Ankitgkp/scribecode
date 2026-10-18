import type { FileTreeEntry } from "@/features/explorer/types";
import type { ProjectInsights } from "@/features/insights/types";
import { isExternalNode } from "@/features/visualization/lib/graph";
import type { Graph } from "@/types/graph";

export const REPOSITORY_FILE_DRAG_TYPE = "application/x-scribecode-file";

export interface StoryStop {
  path: string;
  from: string | null;
  chapter: string;
  readable: boolean;
}

export function isReadableFile(path: string): boolean {
  return (
    !/\.(?:png|jpe?g|gif|webp|ico|avif|pdf|zip|gz|woff2?|ttf|otf|mp[34]|mov|wav|lock|lockb)$/i.test(path) &&
    !/(?:^|\/)(?:package-lock\.json|yarn\.lock|bun\.lock|pnpm-lock\.yaml)$/.test(path)
  );
}

/** An import-guided reading order, never a claim about runtime execution order. */
export function buildInterviewStory(tree: FileTreeEntry[], graph: Graph, insights: ProjectInsights): StoryStop[] {
  const paths = [
    ...new Set([
      ...tree.filter((entry) => entry.type === "blob").map((entry) => entry.path),
      ...graph.nodes.filter((node) => !isExternalNode(node)).map((node) => node.id),
    ]),
  ];
  const known = new Set(paths);
  const outgoing = new Map<string, string[]>();
  for (const edge of graph.edges) {
    if (!known.has(edge.source) || !known.has(edge.target) || edge.source === edge.target) continue;
    outgoing.set(edge.source, [...(outgoing.get(edge.source) ?? []), edge.target]);
  }
  const entryScore = (path: string) => {
    const file = path.split("/").at(-1) ?? path;
    const parent = path.split("/").at(-2);
    if (
      /^(?:main|server)\.[cm]?[jt]sx?$/.test(file) ||
      (/^index\.[cm]?[jt]sx?$/.test(file) && (!parent || parent === "src"))
    )
      return 0;
    if (/^(?:App|app|page)\.[jt]sx?$/.test(file)) return 1;
    if (insights.startHere.some((item) => item.path === path)) return 2;
    return isReadableFile(path) ? 3 : 4;
  };
  const roots = [...paths].sort(
    (a, b) => entryScore(a) - entryScore(b) || a.split("/").length - b.split("/").length || a.localeCompare(b),
  );
  const visited = new Set<string>();
  const result: StoryStop[] = [];
  for (const root of roots) {
    const queue = [{ path: root, from: null as string | null }];
    for (let index = 0; index < queue.length; index++) {
      const stop = queue[index]!;
      if (visited.has(stop.path)) continue;
      visited.add(stop.path);
      const module = insights.modules.find((area) => area.paths.includes(stop.path));
      result.push({
        ...stop,
        chapter: module?.name ?? (isReadableFile(stop.path) ? "Supporting pieces" : "Assets & generated files"),
        readable: isReadableFile(stop.path),
      });
      for (const target of [...(outgoing.get(stop.path) ?? [])].sort())
        if (!visited.has(target)) queue.push({ path: target, from: stop.path });
    }
  }
  return result;
}
