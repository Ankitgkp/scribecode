import { useState } from "react";
import { ChevronDown, ChevronRight, File as FileIcon, Folder, FolderOpen } from "lucide-react";

import { cn } from "@/lib/utils";
import type { FileTreeNode } from "@/features/explorer/lib/buildFileTree";

interface FileTreeProps {
  nodes: FileTreeNode[];
  selectedPath: string;
  expandAll?: boolean;
  onSelect: (path: string) => void;
}

export function FileTree({ nodes, selectedPath, expandAll = false, onSelect }: FileTreeProps) {
  return (
    <ul className="flex flex-col" role="tree">
      {nodes.map((node) => (
        <FileTreeItem
          key={node.path}
          node={node}
          depth={0}
          selectedPath={selectedPath}
          expandAll={expandAll}
          onSelect={onSelect}
        />
      ))}
    </ul>
  );
}

interface FileTreeItemProps {
  node: FileTreeNode;
  depth: number;
  selectedPath: string;
  expandAll: boolean;
  onSelect: (path: string) => void;
}

function FileTreeItem({ node, depth, selectedPath, expandAll, onSelect }: FileTreeItemProps) {
  const [open, setOpen] = useState(depth === 0);
  const isOpen = expandAll || open;

  const paddingLeft = 8 + depth * 12;

  if (node.type === "directory") {
    return (
      <li role="treeitem" aria-expanded={isOpen}>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="flex w-full items-center gap-1.5 rounded-md py-1 pr-2 text-left text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          style={{ paddingLeft }}
        >
          {isOpen ? <ChevronDown className="size-3.5 shrink-0" /> : <ChevronRight className="size-3.5 shrink-0" />}
          {isOpen ? <FolderOpen className="size-3.5 shrink-0" /> : <Folder className="size-3.5 shrink-0" />}
          <span className="truncate">{node.name}</span>
        </button>

        {isOpen ? (
          <ul role="group" className="flex flex-col">
            {node.children.map((child) => (
              <FileTreeItem
                key={child.path}
                node={child}
                depth={depth + 1}
                selectedPath={selectedPath}
                expandAll={expandAll}
                onSelect={onSelect}
              />
            ))}
          </ul>
        ) : null}
      </li>
    );
  }

  const isSelected = node.path === selectedPath;

  return (
    <li role="treeitem" aria-selected={isSelected}>
      <button
        type="button"
        onClick={() => onSelect(node.path)}
        className={cn(
          "flex w-full items-center gap-1.5 rounded-md py-1 pr-2 text-left text-sm transition-colors",
          isSelected
            ? "bg-accent font-medium text-foreground"
            : "text-muted-foreground hover:bg-accent hover:text-foreground",
        )}
        style={{ paddingLeft: paddingLeft + 18 }}
      >
        <FileIcon className="size-3.5 shrink-0" />
        <span className="truncate">{node.name}</span>
      </button>
    </li>
  );
}
