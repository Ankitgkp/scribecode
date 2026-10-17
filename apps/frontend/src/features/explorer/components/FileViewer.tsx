import { AlertTriangle } from "lucide-react";

import type { FileContent } from "@/features/explorer/types";

export function FileViewer({ file }: { file: FileContent }) {
  const lineCount = file.content.split("\n").length;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-4 text-xs text-muted-foreground">
        <span className="truncate font-mono">{file.path}</span>
        <span className="shrink-0">
          {lineCount} lines · {(file.size / 1024).toFixed(1)} KB
        </span>
      </div>

      {file.truncated ? (
        <p className="flex items-center gap-2 rounded-md bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
          <AlertTriangle className="size-3.5 shrink-0" />
          Preview truncated to the first 200,000 characters.
        </p>
      ) : null}

      <pre className="max-h-[520px] overflow-auto rounded-lg border bg-muted/40 p-4 text-xs leading-relaxed">
        <code>{file.content}</code>
      </pre>
    </div>
  );
}
