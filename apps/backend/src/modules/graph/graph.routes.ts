import { Router } from "express";

import { requireRepositoryAccess } from "@/modules/repositories/public-repositories";
import { validate } from "@/middleware/validate";
import { repositoryParamsSchema } from "@/schemas/repository-params";
import { graphController } from "@/modules/graph/graph.controller";
import { dependencyGraphQuerySchema } from "@/modules/graph/graph.schema";

export const graphRouter = Router();

graphRouter.get(
  "/:owner/:name/dependency",
  validate(repositoryParamsSchema, "params"),
  ...requireRepositoryAccess,
  validate(dependencyGraphQuerySchema, "query"),
  graphController.dependencyGraph,
);
