import type { QuestionListItem } from '#fe/model/question-list-item.ts'
import type { QuizListItem } from '#fe/model/quiz-list-item.ts'
import type { Workspace } from '#fe/model/workspace.ts'
import type { WorkspaceCreateResponse, WorkspaceRequest } from '#shared/types/workspace.ts'

import { postJson, fetchJson } from './helpers.ts'

export type { WorkspaceCreateResponse, WorkspaceRequest } from '#shared/types/workspace.ts'

export const postWorkspace = async (workspace: WorkspaceRequest) =>
    await postJson<WorkspaceRequest, WorkspaceCreateResponse>('/api/workspaces', workspace)

export const fetchWorkspace = async (guid: string) => await fetchJson<Workspace>(`/api/workspaces/${guid}`)

export const fetchWorkspaceQuestions = async (guid: string) =>
    await fetchJson<readonly QuestionListItem[]>(`/api/workspaces/${guid}/questions`)

export const fetchWorkspaceQuizzes = async (guid: string) =>
    await fetchJson<readonly QuizListItem[]>(`/api/workspaces/${guid}/quizzes`)
