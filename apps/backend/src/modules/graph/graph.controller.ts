import type { Request, Response } from "express";

import { authUserId } from "@/middleware/auth";
import { getValidated } from "@/middleware/validate";
import type { RepositoryParams } from "@/schemas/repository-params";
import { success } from "@/types/api";
import type { DependencyGraphQuery } from "@/modules/graph/graph.schema";
import * as graphService from "@/modules/graph/graph.service";

export const graphController = {
  async dependencyGraph(req: Request, res: Response): Promise<void> {
    const { owner, name } = getValidated<RepositoryParams>(res, "params");
    const { limit, refresh } = getValidated<DependencyGraphQuery>(res, "query");

    const graph = await graphService.buildDependencyGraph(authUserId(req), owner, name, { limit, refresh });

    res.status(200).json(success({ graph }));
  },
};
