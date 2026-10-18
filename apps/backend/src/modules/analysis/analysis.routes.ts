import { Router } from "express";

import { requireRepositoryAccess } from "@/modules/repositories/public-repositories";
import { validate } from "@/middleware/validate";
import { repositoryParamsSchema } from "@/schemas/repository-params";
import { analysisController } from "@/modules/analysis/analysis.controller";
import {
  architectureRequestSchema,
  explainFileSchema,
  preparationRequestSchema,
  interviewQuestionSchema,
} from "@/modules/analysis/analysis.schema";

export const analysisRouter = Router();

analysisRouter.post(
  "/:owner/:name/file",
  validate(repositoryParamsSchema, "params"),
  ...requireRepositoryAccess,
  validate(explainFileSchema, "body"),
  analysisController.fileAnalysis,
);
analysisRouter.post(
  "/:owner/:name/architecture",
  validate(repositoryParamsSchema, "params"),
  ...requireRepositoryAccess,
  validate(architectureRequestSchema, "body"),
  analysisController.architecture,
);
analysisRouter.post(
  "/:owner/:name/interview/question",
  validate(repositoryParamsSchema, "params"),
  ...requireRepositoryAccess,
  validate(interviewQuestionSchema, "body"),
  analysisController.interviewQuestion,
);
analysisRouter.post(
  "/:owner/:name/prepare",
  validate(repositoryParamsSchema, "params"),
  ...requireRepositoryAccess,
  validate(preparationRequestSchema, "body"),
  analysisController.prepare,
);
