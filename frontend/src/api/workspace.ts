import type { QuestionListItem } from '#model/question-list-item.ts'
import type { QuizListItem } from '#model/quiz-list-item.ts'
import type { Workspace } from '#model/workspace.ts'
import type { WorkspaceCreateResponse, WorkspaceRequest } from '#shared/types/workspace.ts'

import { postJson, fetchJson, workspaceKeyHeaders } from './helpers.ts'

export type { WorkspaceCreateResponse, WorkspaceRequest } from '#shared/types/workspace.ts'

export const postWorkspace = async (workspace: WorkspaceRequest) =>
    await postJson<WorkspaceRequest, WorkspaceCreateResponse>('/api/workspaces', workspace)

export const fetchWorkspace = async (guid: string) =>
    await fetchJson<Workspace>('/api/workspace', { headers: workspaceKeyHeaders(guid) })

export const fetchWorkspaceQuestions = async (guid: string) =>
    await fetchJson<readonly QuestionListItem[]>('/api/workspace/questions', { headers: workspaceKeyHeaders(guid) })

export const fetchWorkspaceQuizzes = async (guid: string) =>
    await fetchJson<readonly QuizListItem[]>('/api/workspace/quizzes', { headers: workspaceKeyHeaders(guid) })
