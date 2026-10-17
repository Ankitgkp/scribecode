import type { Request, Response } from "express";

import { authUserId } from "@/middleware/auth";
import { getValidated } from "@/middleware/validate";
import type { RepositoryParams } from "@/schemas/repository-params";
import { success } from "@/types/api";
import type { FilePathQuery } from "@/modules/files/files.schema";
import * as filesService from "@/modules/files/files.service";

export const filesController = {
  async tree(req: Request, res: Response): Promise<void> {
    const { owner, name } = getValidated<RepositoryParams>(res, "params");

    const files = await filesService.listFileTree(authUserId(req), owner, name);

    res.status(200).json(success({ files }));
  },

  async content(req: Request, res: Response): Promise<void> {
    const { owner, name } = getValidated<RepositoryParams>(res, "params");
    const { path } = getValidated<FilePathQuery>(res, "query");

    const file = await filesService.getFileContent(authUserId(req), owner, name, path);

    res.status(200).json(success({ file }));
  },
};
