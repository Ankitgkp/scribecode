import type { FileTreeEntry } from "@/features/explorer/types";

export interface FileTreeNode {
  name: string;
  path: string;
  type: "file" | "directory";
  children: FileTreeNode[];
}

/**
 * Turns the flat path list returned by the API into a nested tree, sorted with
 * directories first and then alphabetically.
 */
export function buildFileTree(entries: FileTreeEntry[]): FileTreeNode[] {
  const root: FileTreeNode = { name: "", path: "", type: "directory", children: [] };

  for (const entry of entries) {
    if (entry.type !== "blob") {
      continue;
    }

    const segments = entry.path.split("/");
    let current = root;

    segments.forEach((segment, index) => {
      const isLeaf = index === segments.length - 1;
      const path = segments.slice(0, index + 1).join("/");

      let next = current.children.find((child) => child.name === segment);
      if (!next) {
        next = { name: segment, path, type: isLeaf ? "file" : "directory", children: [] };
        current.children.push(next);
      }

      current = next;
    });
  }

  sortTree(root.children);
  return root.children;
}

function sortTree(nodes: FileTreeNode[]): void {
  nodes.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === "directory" ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });

  for (const node of nodes) {
    sortTree(node.children);
  }
}

/** Keeps nodes matching `query` plus their ancestors. */
export function filterFileTree(nodes: FileTreeNode[], query: string): FileTreeNode[] {
  const normalized = query.trim().toLowerCase();
  if (normalized.length === 0) {
    return nodes;
  }

  const result: FileTreeNode[] = [];

  for (const node of nodes) {
    if (node.type === "file") {
      if (node.name.toLowerCase().includes(normalized)) {
        result.push(node);
      }
      continue;
    }

    const children = filterFileTree(node.children, query);
    if (children.length > 0 || node.name.toLowerCase().includes(normalized)) {
      result.push({ ...node, children: children.length > 0 ? children : node.children });
    }
  }

  return result;
}
