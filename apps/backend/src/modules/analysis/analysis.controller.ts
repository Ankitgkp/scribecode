import type { Request, Response } from "express";

import { authUserId } from "@/middleware/auth";
import { getValidated } from "@/middleware/validate";
import type { RepositoryParams } from "@/schemas/repository-params";
import { success } from "@/types/api";
import type { ArchitectureRequestInput, ExplainFileInput } from "@/modules/analysis/analysis.schema";
import * as analysisService from "@/modules/analysis/analysis.service";

export const analysisController = {
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
};
