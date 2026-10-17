interface CodeLinesProps {
  /** 1-based line number of the first rendered line. */
  startLine: number;
  lines: string[];
}

/**
 * Renders a run of source lines with a line-number gutter. Lines wrap (rather
 * than scrolling horizontally) so the annotated view stays readable; the "Raw
 * code" tab keeps the exact, non-wrapping formatting.
 */
export function CodeLines({ startLine, lines }: CodeLinesProps) {
  return (
    <div className="py-2 font-mono text-xs leading-6">
      {lines.map((line, index) => (
        <div key={startLine + index} className="flex">
          <span className="w-11 shrink-0 select-none pr-3 text-right text-[11px] text-muted-foreground/50">
            {startLine + index}
          </span>
          <code className="min-w-0 flex-1 whitespace-pre-wrap break-words pr-4">{line.length > 0 ? line : " "}</code>
        </div>
      ))}
    </div>
  );
}
