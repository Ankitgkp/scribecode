import { Router } from "express";

import { requireRepositoryAccess } from "@/modules/repositories/public-repositories";
import { validate } from "@/middleware/validate";
import { repositoryParamsSchema } from "@/schemas/repository-params";
import { filesController } from "@/modules/files/files.controller";
import { filePathQuerySchema } from "@/modules/files/files.schema";

export const filesRouter = Router();

filesRouter.get("/:owner/:name/tree", validate(repositoryParamsSchema, "params"), ...requireRepositoryAccess, filesController.tree);
filesRouter.get(
  "/:owner/:name/content",
  validate(repositoryParamsSchema, "params"),
  ...requireRepositoryAccess,
  validate(filePathQuerySchema, "query"),
  filesController.content,
);
