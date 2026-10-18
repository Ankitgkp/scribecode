import { repoPath } from "@/lib/paths";
import { apiClient } from "@/services/apiClient";
import type { InterviewAnswer, RepositoryPreparation } from "@/features/insights/types";

export function prepareRepository(
  owner: string,
  name: string,
  refresh: boolean,
  signal?: AbortSignal,
): Promise<RepositoryPreparation> {
  return apiClient.post<RepositoryPreparation>(`/analysis/${repoPath(owner, name)}/prepare`, { refresh }, signal);
}

export function askInterviewQuestion(
  owner: string,
  name: string,
  path: string,
  question: string,
  signal?: AbortSignal,
): Promise<InterviewAnswer> {
  return apiClient.post<InterviewAnswer>(
    `/analysis/${repoPath(owner, name)}/interview/question`,
    { path, question },
    signal,
  );
}
