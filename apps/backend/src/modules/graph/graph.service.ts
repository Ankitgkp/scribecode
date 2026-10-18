import { posix } from "node:path";

import { AppError } from "@/errors/app-error";
import { mapWithConcurrency } from "@/lib/async";
import { fromJsonInput, toJsonInput } from "@/lib/json";
import { prisma } from "@/lib/prisma";
import { getFileContent } from "@/modules/files/files.service";
import { PUBLIC_REPOSITORY_USER_ID } from "@/modules/repositories/public-repositories";
import { getConnectedRepository } from "@/modules/repositories/repositories.service";
import { withEdgeIds, type Graph, type GraphEdge, type GraphNode } from "@/types/graph";

const SOURCE_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"];
const RESOLUTION_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json"];
const IGNORED_SEGMENTS = new Set([
  "node_modules",
  "dist",
  "build",
  "out",
  "coverage",
  ".next",
  ".turbo",
  "vendor",
  "__snapshots__",
]);

/** Captures module specifiers from `import ... from`, side-effect imports and `require(...)`. */
const IMPORT_PATTERN =
  /(?:import\s+[^'"]*from\s*|import\s*\(\s*|import\s*|export\s+[^'"]*from\s*|require\s*\(\s*)['"]([^'"]+)['"]/g;

const MAX_CONCURRENT_REQUESTS = 8;
const MAX_PUBLIC_SOURCE_FILES = 24;

const DEPENDENCY_GRAPH_KIND = "dependency-graph";

interface BuildOptions {
  limit: number;
  /** Bypass the cached graph and rebuild it from GitHub. */
  refresh?: boolean;
}

function isSourceFile(path: string): boolean {
  return SOURCE_EXTENSIONS.some((extension) => path.endsWith(extension));
}

function isIgnored(path: string): boolean {
  return path.split("/").some((segment) => IGNORED_SEGMENTS.has(segment));
}

function topLevelGroup(path: string): string {
  const segments = path.split("/");
  return segments.length > 1 ? (segments[0] as string) : "root";
}

function packageName(specifier: string): string {
  const segments = specifier.split("/");
  if (specifier.startsWith("@")) {
    return segments.slice(0, 2).join("/");
  }
  return segments[0] ?? specifier;
}

function extractSpecifiers(content: string): string[] {
  const specifiers = new Set<string>();

  for (const match of content.matchAll(IMPORT_PATTERN)) {
    const specifier = match[1];
    if (specifier) {
      specifiers.add(specifier);
    }
  }

  return [...specifiers];
}

function resolveRelative(fromPath: string, specifier: string, allPaths: Set<string>): string | null {
  const base = posix.normalize(posix.join(posix.dirname(fromPath), specifier));

  const candidates = [
    base,
    ...RESOLUTION_EXTENSIONS.map((extension) => `${base}${extension}`),
    ...RESOLUTION_EXTENSIONS.map((extension) => `${base}/index${extension}`),
  ];

  return candidates.find((candidate) => allPaths.has(candidate)) ?? null;
}

/**
 * Builds a file-level dependency graph for a connected repository by parsing
 * module specifiers out of the source files. External packages become their own
 * nodes so the graph shows both internal structure and third-party surface.
 *
 * The result is cached per repository (and per file limit): building it means
 * downloading source files from GitHub, which is by far the expensive part and
 * should not happen on every page view.
 */
export async function buildDependencyGraph(
  userId: string,
  owner: string,
  name: string,
  options: BuildOptions,
): Promise<Graph> {
  const repository = await getConnectedRepository(userId, owner, name);
  // Anonymous GitHub API access is shared by IP and has a small hourly limit.
  // Leave room for the tree, chapters, and other repositories.
  const limit = userId === PUBLIC_REPOSITORY_USER_ID ? Math.min(options.limit, MAX_PUBLIC_SOURCE_FILES) : options.limit;
  const cacheKey = `limit:${limit}`;

  if (!options.refresh) {
    const cached = await prisma.analysis.findFirst({
      where: { repositoryId: repository.id, kind: DEPENDENCY_GRAPH_KIND, targetPath: cacheKey },
      orderBy: { createdAt: "desc" },
    });

    if (cached) {
      return fromJsonInput<Graph>(cached.content);
    }
  }

  const blobs = await prisma.repositoryFile.findMany({
    where: { repositoryId: repository.id, type: "blob" },
    orderBy: { path: "asc" },
  });

  const allPaths = new Set(blobs.map((blob) => blob.path));
  const sourcePaths = blobs
    .map((blob) => blob.path)
    .filter((path) => isSourceFile(path) && !isIgnored(path))
    .slice(0, limit);

  const sourceSet = new Set(sourcePaths);

  const fetched = await mapWithConcurrency(sourcePaths, MAX_CONCURRENT_REQUESTS, async (path) => {
    try {
      const file = await getFileContent(userId, owner, name, path);
      return { path, content: file.content };
    } catch (error) {
      // A stale or non-file tree entry can be skipped. Access and rate-limit
      // failures must remain visible so we do not cache an empty graph.
      if (error instanceof AppError && (error.statusCode === 400 || error.statusCode === 404)) {
        return { path, content: "" };
      }
      throw error;
    }
  });

  const nodes = new Map<string, GraphNode>();
  const edges: GraphEdge[] = [];

  for (const path of sourcePaths) {
    nodes.set(path, { id: path, label: posix.basename(path), group: topLevelGroup(path) });
  }

  const link = (source: string, target: string, label: string): void => {
    edges.push({ source, target, label });
  };

  for (const { path, content } of fetched) {
    for (const specifier of extractSpecifiers(content)) {
      if (specifier.startsWith(".")) {
        const resolved = resolveRelative(path, specifier, allPaths);
        if (!resolved) {
          continue;
        }

        if (!nodes.has(resolved)) {
          nodes.set(resolved, { id: resolved, label: posix.basename(resolved), group: topLevelGroup(resolved) });
        }

        if (sourceSet.has(resolved) || !isSourceFile(resolved)) {
          link(path, resolved, "imports");
        }
        continue;
      }

      const pkg = packageName(specifier);
      const nodeId = `npm:${pkg}`;

      if (!nodes.has(nodeId)) {
        nodes.set(nodeId, { id: nodeId, label: pkg, group: "external" });
      }

      link(path, nodeId, "depends on");
    }
  }

  const graph = withEdgeIds({ nodes: [...nodes.values()], edges });

  await prisma.analysis.create({
    data: {
      repositoryId: repository.id,
      kind: DEPENDENCY_GRAPH_KIND,
      targetPath: cacheKey,
      content: toJsonInput(graph),
    },
  });

  return graph;
}
