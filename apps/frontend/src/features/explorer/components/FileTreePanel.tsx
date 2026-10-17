import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

import { Input } from "@/components/ui/input";
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

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-3">
      <Input
        placeholder="Search files…"
        value={filter}
        onChange={(event) => setFilter(event.target.value)}
        aria-label="Search files"
      />

      {status === "loading" ? (
        <p className="flex items-center gap-2 px-1 py-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading tree…
        </p>
      ) : null}

      {status === "error" ? <p className="px-1 py-2 text-sm text-destructive">{error}</p> : null}

      {status === "success" && filtered.length === 0 ? (
        <p className="px-1 py-2 text-sm text-muted-foreground">No files found.</p>
      ) : null}

      {filtered.length > 0 ? (
        <FileTree nodes={filtered} selectedPath={selectedPath} expandAll={isSearching} onSelect={onSelect} />
      ) : null}
    </div>
  );
}
