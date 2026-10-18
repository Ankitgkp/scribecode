import { Router } from "express";

import { optionalAuth, requireAuth } from "@/middleware/auth";
import { requireRepositoryAccess } from "@/modules/repositories/public-repositories";
import { validate } from "@/middleware/validate";
import { repositoriesController } from "@/modules/repositories/repositories.controller";
import {
  connectRepositorySchema,
  listGitHubRepositoriesQuerySchema,
  repositoryParamsSchema,
} from "@/modules/repositories/repositories.schema";

export const repositoriesRouter = Router();

repositoriesRouter.post("/open", optionalAuth, validate(connectRepositorySchema, "body"), repositoriesController.open);

repositoriesRouter.get(
  "/available",
  requireAuth,
  validate(listGitHubRepositoriesQuerySchema, "query"),
  repositoriesController.listAvailable,
);
repositoriesRouter.get("/", requireAuth, repositoriesController.listConnected);
repositoriesRouter.post("/", requireAuth, validate(connectRepositorySchema, "body"), repositoriesController.connect);
repositoriesRouter.post("/:owner/:name/sync", validate(repositoryParamsSchema, "params"), ...requireRepositoryAccess, repositoriesController.sync);
repositoriesRouter.get("/:owner/:name", validate(repositoryParamsSchema, "params"), ...requireRepositoryAccess, repositoriesController.getOne);
