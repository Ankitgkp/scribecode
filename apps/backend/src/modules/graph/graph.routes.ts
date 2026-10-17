import { Router } from "express";

import { requireAuth } from "@/middleware/auth";
import { validate } from "@/middleware/validate";
import { repositoryParamsSchema } from "@/schemas/repository-params";
import { graphController } from "@/modules/graph/graph.controller";
import { dependencyGraphQuerySchema } from "@/modules/graph/graph.schema";

export const graphRouter = Router();

graphRouter.use(requireAuth);

graphRouter.get(
  "/:owner/:name/dependency",
  validate(repositoryParamsSchema, "params"),
  validate(dependencyGraphQuerySchema, "query"),
  graphController.dependencyGraph,
);
