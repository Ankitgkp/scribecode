import { Router } from "express";

import { requireAuth } from "@/middleware/auth";
import { validate } from "@/middleware/validate";
import { repositoryParamsSchema } from "@/schemas/repository-params";
import { analysisController } from "@/modules/analysis/analysis.controller";
import { architectureRequestSchema, explainFileSchema } from "@/modules/analysis/analysis.schema";

export const analysisRouter = Router();

analysisRouter.use(requireAuth);

analysisRouter.post(
  "/:owner/:name/file",
  validate(repositoryParamsSchema, "params"),
  validate(explainFileSchema, "body"),
  analysisController.fileAnalysis,
);
analysisRouter.post(
  "/:owner/:name/architecture",
  validate(repositoryParamsSchema, "params"),
  validate(architectureRequestSchema, "body"),
  analysisController.architecture,
);
