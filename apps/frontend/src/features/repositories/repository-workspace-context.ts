import { createContext, useContext } from "react";

import type { useRepository } from "@/features/repositories/hooks/useRepository";

export interface RepositoryWorkspace {
  repository: ReturnType<typeof useRepository>;
  syncToken: number;
  syncing: boolean;
  syncError: string | null;
  sync: () => Promise<void>;
}

export const RepositoryWorkspaceContext = createContext<RepositoryWorkspace | null>(null);

export function useRepositoryWorkspace(): RepositoryWorkspace | null {
  return useContext(RepositoryWorkspaceContext);
}
