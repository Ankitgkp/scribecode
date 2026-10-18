import { AlertTriangle, Check, Info, RefreshCw, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { UnderstandingLoader } from "@/components/ui/understanding-loader";

import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { AnnotatedCode } from "@/features/analysis/components/AnnotatedCode";
import { BlockDetailPanel } from "@/features/analysis/components/BlockDetailPanel";
import { useFileAnalysis } from "@/features/analysis/hooks/useFileAnalysis";
import { accentFor } from "@/features/analysis/lib/accents";
import { blockKey, splitLines } from "@/features/analysis/lib/blocks";
import type { FileAnalysis, FileBlock } from "@/features/analysis/types";
import { FileViewer } from "@/features/explorer/components/FileViewer";
import { useFileContent } from "@/features/explorer/hooks/useFileContent";
import { cn } from "@/lib/utils";

type CodeMode = "annotated" | "raw";

const MODES = [
  { id: "annotated", label: "Annotated walkthrough" },
  { id: "raw", label: "Raw code" },
] as const;

interface FileAnalysisViewProps {
  owner: string;
  name: string;
  path: string;
  context?: ReactNode;
}

/**
 * The "Explain" surface for a single file.
 *
 * Explanation first (what the file is + a few crisp highlights), then the code
 * itself as an annotated walkthrough where each major block sits beside a short
 * callout. Full explanations live behind "More detail", and the untouched
 * source is always one toggle away.
 */
export function FileAnalysisView({ owner, name, path, context }: FileAnalysisViewProps) {
  const file = useFileContent(owner, name, path);
  const analysis = useFileAnalysis(owner, name, path);

  const [mode, setMode] = useState<CodeMode>("annotated");
  const [openBlock, setOpenBlock] = useState<FileBlock | null>(null);

  useEffect(() => {
    setOpenBlock(null);
  }, [path]);

  const content = file.data?.content ?? "";
  const lines = useMemo(() => splitLines(content), [content]);
  const blocks = analysis.data?.blocks ?? [];

  const openIndex = openBlock ? blocks.findIndex((block) => blockKey(block) === blockKey(openBlock)) : -1;
  const openAccent = accentFor(openIndex < 0 ? 0 : openIndex);
  const openCode = openBlock ? lines.slice(openBlock.startLine - 1, openBlock.endLine) : [];

  if (path.length === 0) {
    return (
      <Card>
        <CardContent>
          <p className="text-sm text-muted-foreground">Select a file from the tree to see how it works.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="rounded-[1.75rem] border-[#e7eae8] bg-[#f1eef9] shadow-none dark:border-white/10 dark:bg-violet-950/35">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <span className="grid size-9 place-items-center rounded-xl bg-white/70 text-violet-700 dark:bg-white/10 dark:text-violet-200">
              <Sparkles className="size-4" />
            </span>
            What this file does
          </CardTitle>
          <CardDescription className="break-all font-mono text-xs">{path}</CardDescription>
          <CardAction>
            <Button variant="outline" size="sm" onClick={analysis.regenerate} disabled={analysis.status === "loading"}>
              <RefreshCw className={cn("size-3.5", analysis.status === "loading" && "animate-spin")} />
              Regenerate
            </Button>
          </CardAction>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          {analysis.status === "loading" ? <UnderstandingLoader label="Reading this file…" /> : null}

          {analysis.status === "error" ? <p className="text-sm text-destructive">{analysis.error}</p> : null}

          {analysis.data ? <Summary analysis={analysis.data} /> : null}
        </CardContent>
      </Card>

      {context}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs items={MODES} value={mode} onChange={(next) => setMode(next)} />
        {analysis.status === "loading" ? <UnderstandingLoader compact label="Annotating the code…" /> : null}
      </div>

      {mode === "raw" ? (
        file.data ? (
          <FileViewer file={file.data} />
        ) : (
          <FilePlaceholder status={file.status} error={file.error} />
        )
      ) : (
        <>
          {file.data?.truncated ? (
            <p className="flex items-center gap-2 rounded-md bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
              <AlertTriangle className="size-3.5 shrink-0" />
              Preview truncated to the first 200,000 characters.
            </p>
          ) : null}

          {analysis.status === "success" && blocks.length === 0 ? (
            <p className="flex items-center gap-2 rounded-lg border border-dashed bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              <Info className="size-3.5 shrink-0" />
              No block annotations for this file — showing the source.
            </p>
          ) : null}

          {file.data ? (
            <AnnotatedCode
              content={file.data.content}
              blocks={blocks}
              activeKey={openBlock ? blockKey(openBlock) : null}
              onOpen={setOpenBlock}
            />
          ) : (
            <FilePlaceholder status={file.status} error={file.error} />
          )}
        </>
      )}

      <BlockDetailPanel
        block={openBlock}
        accent={openAccent}
        code={openCode}
        cached={analysis.data?.cached ?? false}
        regenerating={analysis.status === "loading"}
        onClose={() => setOpenBlock(null)}
        onRegenerate={analysis.regenerate}
      />
    </div>
  );
}

function Summary({ analysis }: { analysis: FileAnalysis }) {
  return (
    <div className="flex flex-col gap-4">
      <p className="max-w-4xl text-2xl leading-relaxed font-medium tracking-tight sm:text-3xl">{analysis.purpose}</p>

      {analysis.highlights.length > 0 ? (
        <ul className="grid gap-2 sm:grid-cols-2">
          {analysis.highlights.map((highlight) => (
            <li key={highlight} className="flex items-start gap-2 text-sm text-muted-foreground">
              <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-500 dark:text-emerald-400" />
              <span>{highlight}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {analysis.dependencies.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Uses</span>
          {analysis.dependencies.map((dependency) => (
            <span
              key={dependency}
              className="rounded-full bg-muted px-2.5 py-0.5 font-mono text-[11px] text-muted-foreground"
            >
              {dependency}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function FilePlaceholder({ status, error }: { status: "loading" | "success" | "error"; error: string | null }) {
  if (status === "error") {
    return <p className="text-sm text-destructive">{error}</p>;
  }

  return <UnderstandingLoader label="Loading file…" />;
}
