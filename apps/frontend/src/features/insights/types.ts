import type { Graph } from "@/types/graph";

export type ModuleKind = "interface" | "feature" | "logic" | "data" | "integration" | "configuration";

export interface InsightFile {
  path: string;
  label: string;
  reason: string;
}

export interface InsightModule {
  id: string;
  name: string;
  kind: ModuleKind;
  purpose: string;
  paths: string[];
  connectsTo: string[];
}

export interface InsightFlow {
  id: string;
  name: string;
  description: string;
  steps: string[];
}

export interface ProjectInsights {
  title: string;
  summary: string;
  startHere: InsightFile[];
  modules: InsightModule[];
  flows: InsightFlow[];
  integrations: string[];
  cached: boolean;
  limitedAnalysis: boolean;
}

export interface RepositoryPreparation {
  insights: ProjectInsights;
  graph: Graph;
}

export interface InterviewAnswer {
  answer: string;
  points: string[];
  evidence: { path: string; note: string }[];
  followUpQuestions: string[];
  cached: boolean;
}
