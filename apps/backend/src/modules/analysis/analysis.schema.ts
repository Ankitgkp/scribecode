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
  /** Two crisp sentences: the file's role and why it matters. */
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

const insightFileSchema = z.object({
  path: z.string(),
  label: z.string(),
  reason: z.string(),
});

const insightModuleSchema = z.object({
  id: z.string(),
  name: z.string(),
  kind: z.enum(["interface", "feature", "logic", "data", "integration", "configuration"]),
  purpose: z.string(),
  paths: z.array(z.string()).max(8),
  connectsTo: z.array(z.string()).max(8),
});

const insightFlowSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  steps: z.array(z.string()).min(2).max(6),
});

/** A product-oriented map of a repository, deliberately free of display markup. */
export const projectInsightsSchema = z.object({
  title: z.string(),
  summary: z.string(),
  startHere: z.array(insightFileSchema).max(5),
  modules: z.array(insightModuleSchema).max(6),
  flows: z.array(insightFlowSchema).max(3),
  integrations: z.array(z.string()).max(8),
});

export type ProjectInsights = z.infer<typeof projectInsightsSchema>;

export const preparationRequestSchema = z.object({
  refresh: z.boolean().optional().default(false),
});

export type PreparationRequestInput = z.infer<typeof preparationRequestSchema>;

export const interviewQuestionSchema = z.object({
  path: z.string().min(1).max(1000),
  question: z.string().trim().min(3).max(1200),
});
export type InterviewQuestionInput = z.infer<typeof interviewQuestionSchema>;

export const interviewAnswerSchema = z.object({
  answer: z.string().min(1).max(4000),
  points: z.array(z.string().max(500)).max(5),
  evidence: z.array(z.object({ path: z.string(), note: z.string().max(500) })).max(4),
  followUpQuestions: z.array(z.string().max(250)).max(3),
});
export type InterviewAnswer = z.infer<typeof interviewAnswerSchema>;
