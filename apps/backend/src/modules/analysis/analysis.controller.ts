import type { Request, Response } from "express";

import { authUserId } from "@/middleware/auth";
import { getValidated } from "@/middleware/validate";
import type { RepositoryParams } from "@/schemas/repository-params";
import { success } from "@/types/api";
import type {
  ArchitectureRequestInput,
  ExplainFileInput,
  PreparationRequestInput,
  InterviewQuestionInput,
} from "@/modules/analysis/analysis.schema";
import * as analysisService from "@/modules/analysis/analysis.service";
import { analyzeProjectInsights } from "@/modules/analysis/project-insights.service";
import { buildDependencyGraph } from "@/modules/graph/graph.service";
import { listFileTree } from "@/modules/files/files.service";
import { answerInterviewQuestion } from "@/modules/analysis/interview.service";

export const analysisController = {
  async interviewQuestion(req: Request, res: Response): Promise<void> {
    const { owner, name } = getValidated<RepositoryParams>(res, "params");
    const input = getValidated<InterviewQuestionInput>(res, "body");
    const answer = await answerInterviewQuestion(authUserId(req), owner, name, input);
    res.status(200).json(success(answer));
  },
  async fileAnalysis(req: Request, res: Response): Promise<void> {
    const { owner, name } = getValidated<RepositoryParams>(res, "params");
    const { path, refresh } = getValidated<ExplainFileInput>(res, "body");

    const analysis = await analysisService.analyzeFile(authUserId(req), owner, name, path, { refresh });

    res.status(200).json(success({ analysis }));
  },

  async architecture(req: Request, res: Response): Promise<void> {
    const { owner, name } = getValidated<RepositoryParams>(res, "params");
    const { refresh } = getValidated<ArchitectureRequestInput>(res, "body");

    const analysis = await analysisService.analyzeArchitecture(authUserId(req), owner, name, { refresh });

    res.status(200).json(success({ analysis }));
  },

  async prepare(req: Request, res: Response): Promise<void> {
    const { owner, name } = getValidated<RepositoryParams>(res, "params");
    const { refresh } = getValidated<PreparationRequestInput>(res, "body");
    const userId = authUserId(req);
    // Populate the cached tree first. The dependency builder reads that cache.
    await listFileTree(userId, owner, name);
    const graph = await buildDependencyGraph(userId, owner, name, { limit: 60, refresh });
    const insights = await analyzeProjectInsights(userId, owner, name, graph, { refresh });

    res.status(200).json(success({ insights, graph }));
  },
};
