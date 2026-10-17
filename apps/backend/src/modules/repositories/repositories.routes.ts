import { Router } from "express";

import { requireAuth } from "@/middleware/auth";
import { validate } from "@/middleware/validate";
import { repositoriesController } from "@/modules/repositories/repositories.controller";
import {
  connectRepositorySchema,
  listGitHubRepositoriesQuerySchema,
  repositoryParamsSchema,
} from "@/modules/repositories/repositories.schema";

export const repositoriesRouter = Router();

repositoriesRouter.use(requireAuth);

repositoriesRouter.get(
  "/available",
  validate(listGitHubRepositoriesQuerySchema, "query"),
  repositoriesController.listAvailable,
);
repositoriesRouter.get("/", repositoriesController.listConnected);
repositoriesRouter.post("/", validate(connectRepositorySchema, "body"), repositoriesController.connect);
repositoriesRouter.post("/:owner/:name/sync", validate(repositoryParamsSchema, "params"), repositoriesController.sync);
repositoriesRouter.get("/:owner/:name", validate(repositoryParamsSchema, "params"), repositoriesController.getOne);
