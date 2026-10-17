import { Router } from "express";

import { validate } from "@/middleware/validate";
import { healthController } from "@/modules/health/health.controller";
import { healthQuerySchema } from "@/modules/health/health.schema";

export const healthRouter = Router();

healthRouter.get("/", validate(healthQuerySchema, "query"), healthController.getHealth);
healthRouter.get("/ready", healthController.getReadiness);
