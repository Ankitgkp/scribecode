import { Router, type Express } from "express";

import { analysisRouter } from "@/modules/analysis/analysis.routes";
import { authRouter } from "@/modules/auth/auth.routes";
import { filesRouter } from "@/modules/files/files.routes";
import { graphRouter } from "@/modules/graph/graph.routes";
import { healthRouter } from "@/modules/health/health.routes";
import { repositoriesRouter } from "@/modules/repositories/repositories.routes";

export const API_PREFIX = "/api/v1";

/**
 * Central API registry. Every feature router is mounted here so the full API
 * surface can be understood from a single file.
 */
export function registerRoutes(app: Express): void {
  const apiRouter = Router();

  apiRouter.use("/health", healthRouter);
  apiRouter.use("/auth", authRouter);
  apiRouter.use("/repositories", repositoriesRouter);
  apiRouter.use("/files", filesRouter);
  apiRouter.use("/graph", graphRouter);
  apiRouter.use("/analysis", analysisRouter);

  app.use(API_PREFIX, apiRouter);
}
