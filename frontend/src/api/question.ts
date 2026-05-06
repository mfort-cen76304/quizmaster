import type { QuestionAnswer } from '#model/question.ts'
import type { IdResponse } from '#shared/types/id-response.ts'
import type { Question, QuestionEvaluation, QuestionRequest, QuestionTake } from '#shared/types/question.ts'

import { fetchJson, postJson, patchJson, callDelete, workspaceKeyHeaders } from './helpers.ts'

export type { QuestionRequest } from '#shared/types/question.ts'

export const fetchQuestion = async (questionId: string) => await fetchJson<QuestionTake>(`/api/question/${questionId}`)

export const submitQuestionAnswer = async (questionId: string, answer: QuestionAnswer) =>
    await postJson<QuestionAnswer, QuestionEvaluation>(`/api/question/${questionId}/submit`, answer)

export const fetchWorkspaceQuestion = async (workspaceGuid: string, questionId: string) =>
    await fetchJson<Question>(`/api/workspace/questions/${questionId}`, { headers: workspaceKeyHeaders(workspaceGuid) })

export const saveQuestion = async (workspaceGuid: string, question: QuestionRequest) =>
    await postJson<QuestionRequest, IdResponse>('/api/workspace/questions', question, {
        headers: workspaceKeyHeaders(workspaceGuid),
    })

export const updateQuestion = async (workspaceGuid: string, questionId: number, question: QuestionRequest) =>
    await patchJson<QuestionRequest, IdResponse>(`/api/workspace/questions/${questionId}`, question, {
        headers: workspaceKeyHeaders(workspaceGuid),
    })

export const deleteQuestion = async (workspaceGuid: string, questionId: string) =>
    await callDelete(`/api/workspace/questions/${questionId}`, { headers: workspaceKeyHeaders(workspaceGuid) })
