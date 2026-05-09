import type { QuestionListItem } from '#fe/make/model/question-list-item.ts'
import type { QuizListItem } from '#fe/make/model/quiz-list-item.ts'
import type { Workspace } from '#fe/make/model/workspace.ts'
import { postJson, fetchJson } from '#fe/shared/api/helpers.ts'
import type { WorkspaceCreateResponse, WorkspaceRequest } from '#shared/types/workspace.ts'

export type { WorkspaceCreateResponse, WorkspaceRequest } from '#shared/types/workspace.ts'

export const postWorkspace = async (workspace: WorkspaceRequest) =>
    await postJson<WorkspaceRequest, WorkspaceCreateResponse>('/api/workspaces', workspace)

export const fetchWorkspace = async (guid: string) => await fetchJson<Workspace>(`/api/workspaces/${guid}`)

export const fetchWorkspaceQuestions = async (guid: string) =>
    await fetchJson<readonly QuestionListItem[]>(`/api/workspaces/${guid}/questions`)

export const fetchWorkspaceQuizzes = async (guid: string) =>
    await fetchJson<readonly QuizListItem[]>(`/api/workspaces/${guid}/quizzes`)
