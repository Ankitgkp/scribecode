import type { Request, Response } from "express";

import { authUserId } from "@/middleware/auth";
import { getValidated } from "@/middleware/validate";
import { success } from "@/types/api";
import { toRepositoryDto } from "@/modules/repositories/repositories.mapper";
import type {
  ConnectRepositoryInput,
  ListGitHubRepositoriesQuery,
  RepositoryParams,
} from "@/modules/repositories/repositories.schema";
import * as repositoriesService from "@/modules/repositories/repositories.service";
import { openRepository } from "@/modules/repositories/public-repositories";

export const repositoriesController = {
  async open(req: Request, res: Response): Promise<void> {
    const { owner, name } = getValidated<ConnectRepositoryInput>(res, "body");
    const repository = await openRepository(owner, name, req.auth?.user.id);
    res.status(200).json(success({ repository: toRepositoryDto(repository) }));
  },
  /** Repositories the connected GitHub account can access. */
  async listAvailable(req: Request, res: Response): Promise<void> {
    const { page, perPage } = getValidated<ListGitHubRepositoriesQuery>(res, "query");

    const repositories = await repositoriesService.listAvailableRepositories(authUserId(req), { page, perPage });

    res.status(200).json(success({ repositories }));
  },

  /** Repositories the user has already connected. */
  async listConnected(req: Request, res: Response): Promise<void> {
    const repositories = await repositoriesService.listConnectedRepositories(authUserId(req));

    res.status(200).json(success({ repositories: repositories.map(toRepositoryDto) }));
  },

  async connect(req: Request, res: Response): Promise<void> {
    const { owner, name } = getValidated<ConnectRepositoryInput>(res, "body");

    const repository = await repositoriesService.connectRepository(authUserId(req), owner, name);

    res.status(201).json(success({ repository: toRepositoryDto(repository) }));
  },

  async getOne(req: Request, res: Response): Promise<void> {
    const { owner, name } = getValidated<RepositoryParams>(res, "params");

    const repository = await repositoriesService.getConnectedRepository(authUserId(req), owner, name);

    res.status(200).json(success({ repository: toRepositoryDto(repository) }));
  },

  /** Refreshes the cached file tree from GitHub. */
  async sync(req: Request, res: Response): Promise<void> {
    const { owner, name } = getValidated<RepositoryParams>(res, "params");

    const result = await repositoriesService.syncRepositoryFiles(authUserId(req), owner, name);

    res.status(200).json(success(result));
  },
};
