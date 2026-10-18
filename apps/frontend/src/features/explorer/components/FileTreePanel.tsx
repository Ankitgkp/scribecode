import { useMemo, useState } from "react";
import { FolderTree, Search } from "lucide-react";
import { UnderstandingLoader } from "@/components/ui/understanding-loader";

import { FileTree } from "@/features/explorer/components/FileTree";
import { filterFileTree, type FileTreeNode } from "@/features/explorer/lib/buildFileTree";

interface FileTreePanelProps {
  nodes: FileTreeNode[];
  status: "loading" | "success" | "error";
  error: string | null;
  selectedPath: string;
  onSelect: (path: string) => void;
}

export function FileTreePanel({ nodes, status, error, selectedPath, onSelect }: FileTreePanelProps) {
  const [filter, setFilter] = useState("");

  const filtered = useMemo(() => filterFileTree(nodes, filter), [nodes, filter]);
  const isSearching = filter.trim().length > 0;
  const fileCount = useMemo(() => countFiles(nodes), [nodes]);

  return (
    <div className="flex min-h-[400px] flex-col gap-4 rounded-xl bg-white p-4 shadow-[0_14px_40px_-35px_rgba(0,0,0,.3)] dark:bg-[#202525]">
      <div className="flex items-center justify-between gap-2 px-1 pt-1">
        <div className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-xl bg-[#e5f2ee] text-teal-800 dark:bg-teal-900/50 dark:text-teal-200">
            <FolderTree className="size-4.5" />
          </span>
          <div>
            <h2 className="text-sm font-semibold">Project files</h2>
            <p className="text-[11px] text-muted-foreground">Select a file or drag it to the map</p>
          </div>
        </div>
        <span className="rounded-full bg-[#f3f4f2] px-2.5 py-1 text-xs font-semibold text-[#6a7771] dark:bg-white/10 dark:text-white/60">
          {fileCount}
        </span>
      </div>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          placeholder="Search files…"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          aria-label="Search files"
          className="h-10 w-full rounded-lg border border-transparent bg-[#f4f5f3] pr-3 pl-10 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15 dark:bg-white/5"
        />
      </div>

      {status === "loading" ? <UnderstandingLoader compact label="Loading files…" /> : null}

      {status === "error" ? <p className="px-1 py-2 text-sm text-destructive">{error}</p> : null}

      {status === "success" && filtered.length === 0 ? (
        <p className="px-1 py-2 text-sm text-muted-foreground">No files found.</p>
      ) : null}

      {filtered.length > 0 ? (
        <div className="min-h-0 overflow-auto border-t border-[#edf0ed] pt-3 dark:border-white/10">
          <FileTree nodes={filtered} selectedPath={selectedPath} expandAll={isSearching} onSelect={onSelect} />
        </div>
      ) : null}
    </div>
  );
}

function countFiles(nodes: FileTreeNode[]): number {
  return nodes.reduce((total, node) => total + (node.type === "file" ? 1 : countFiles(node.children)), 0);
}
