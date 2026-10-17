import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";

import { corsOrigins } from "@/config/env";
import { errorHandler } from "@/middleware/error-handler";
import { notFoundHandler } from "@/middleware/not-found";
import { requestLogger } from "@/middleware/request-logger";
import { registerRoutes } from "@/routes";

export function createApp(): Express {
  const app = express();

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(
    cors({
      origin: corsOrigins,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));
  app.use(cookieParser());
  app.use(requestLogger);

  registerRoutes(app);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
