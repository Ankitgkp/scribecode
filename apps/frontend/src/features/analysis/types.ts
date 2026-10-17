import type { Graph } from "@/types/graph";

/** A contiguous, explained region of a file (function, class, hook, config, …). */
export interface FileBlock {
  name: string;
  kind: string;
  /** 1-based, inclusive. */
  startLine: number;
  /** 1-based, inclusive. */
  endLine: number;
  /** Crisp, single-line description shown inline beside the code. */
  label: string;
  /** Full explanation revealed on demand. */
  detail: string;
}

export interface FileAnalysis {
  /** One sentence: what the file is for. */
  purpose: string;
  /** 3-6 short bullets covering only what matters. */
  highlights: string[];
  blocks: FileBlock[];
  dependencies: string[];
  cached: boolean;
}

export interface ArchitectureAnalysis {
  title: string;
  overview: string;
  graph: Graph;
  cached: boolean;
}
