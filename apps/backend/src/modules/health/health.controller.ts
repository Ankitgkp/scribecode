import type { Request, Response } from "express";

import { getValidated } from "@/middleware/validate";
import type { HealthQuery } from "@/modules/health/health.schema";
import { getHealth, getReadiness } from "@/modules/health/health.service";
import { success } from "@/types/api";

export const healthController = {
  getHealth(_req: Request, res: Response): void {
    const query = getValidated<HealthQuery>(res, "query");
    res.status(200).json(success(getHealth({ verbose: query.verbose })));
  },

  async getReadiness(_req: Request, res: Response): Promise<void> {
    const payload = await getReadiness();
    res.status(200).json(success(payload));
  },
};
