import { Router } from "express";

import { requireAuth } from "@/middleware/auth";
import { validate } from "@/middleware/validate";
import { repositoryParamsSchema } from "@/schemas/repository-params";
import { filesController } from "@/modules/files/files.controller";
import { filePathQuerySchema } from "@/modules/files/files.schema";

export const filesRouter = Router();

filesRouter.use(requireAuth);

filesRouter.get("/:owner/:name/tree", validate(repositoryParamsSchema, "params"), filesController.tree);
filesRouter.get(
  "/:owner/:name/content",
  validate(repositoryParamsSchema, "params"),
  validate(filePathQuerySchema, "query"),
  filesController.content,
);
