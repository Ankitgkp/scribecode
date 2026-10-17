import { z } from "zod";

import { graphSchema } from "@/types/graph";

export const explainFileSchema = z.object({
  path: z.string().min(1).max(1000),
  refresh: z.boolean().optional().default(false),
});

export type ExplainFileInput = z.infer<typeof explainFileSchema>;

export const architectureRequestSchema = z.object({
  refresh: z.boolean().optional().default(false),
});

export type ArchitectureRequestInput = z.infer<typeof architectureRequestSchema>;

/**
 * A contiguous, explained region of a file (a function, class, component, hook,
 * route, config block, or other notable feature).
 *
 * Line ranges are 1-based and inclusive. They are validated against the real
 * file length by `normalizeBlocks` before they ever reach the client.
 */
export const fileBlockSchema = z.object({
  /** Symbol or feature name, e.g. `useFileContent` or `Auth middleware`. */
  name: z.string(),
  /** Coarse category used for the badge: function | class | component | hook | route | config | type | section | feature. */
  kind: z.string(),
  startLine: z.number().int(),
  endLine: z.number().int(),
  /** Crisp, single-line description shown inline beside the code. */
  label: z.string(),
  /** Full explanation revealed on demand ("More detail"). */
  detail: z.string(),
});

export type FileBlock = z.infer<typeof fileBlockSchema>;

/**
 * Structured output of a file walkthrough. Deliberately terse: `purpose` and
 * `highlights` are the only prose many readers will need, and the heavy detail
 * is tucked into per-block `detail` strings.
 */
export const fileAnalysisSchema = z.object({
  /** One sentence: what the file is for. */
  purpose: z.string(),
  /** 3-6 short bullets covering only what matters. */
  highlights: z.array(z.string()),
  blocks: z.array(fileBlockSchema),
  /** Notable modules/packages the file relies on (names only). */
  dependencies: z.array(z.string()),
});

export type FileAnalysis = z.infer<typeof fileAnalysisSchema>;

/** Structured output of an AI architecture map. */
export const architectureAnalysisSchema = z.object({
  title: z.string(),
  overview: z.string(),
  graph: graphSchema,
});

export type ArchitectureAnalysis = z.infer<typeof architectureAnalysisSchema>;
