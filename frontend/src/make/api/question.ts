import { fetchJson, postJson, patchJson, callDelete } from '#fe/shared/api/helpers.ts'
import type { IdResponse } from '#shared/types/id-response.ts'
import type { Question, QuestionRequest } from '#shared/types/question.ts'

export type { QuestionRequest } from '#shared/types/question.ts'

export const fetchWorkspaceQuestion = async (workspaceGuid: string, questionId: string) =>
    await fetchJson<Question>(`/api/workspaces/${workspaceGuid}/questions/${questionId}`)

export const saveQuestion = async (workspaceGuid: string, question: QuestionRequest) =>
    await postJson<QuestionRequest, IdResponse>(`/api/workspaces/${workspaceGuid}/questions`, question)

export const updateQuestion = async (workspaceGuid: string, questionId: number, question: QuestionRequest) =>
    await patchJson<QuestionRequest, IdResponse>(`/api/workspaces/${workspaceGuid}/questions/${questionId}`, question)

export const deleteQuestion = async (workspaceGuid: string, questionId: string) =>
    await callDelete(`/api/workspaces/${workspaceGuid}/questions/${questionId}`)
