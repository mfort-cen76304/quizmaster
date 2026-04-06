import type { Question } from '#model/question.ts'

import { fetchJson, postJson, patchJson, callDelete } from './helpers.ts'

export const fetchQuestion = async (questionId: string) => await fetchJson<Question>(`/api/question/${questionId}`)

export const fetchWorkspaceQuestion = async (workspaceGuid: string, questionId: string) =>
    await fetchJson<Question>(`/api/workspaces/${workspaceGuid}/questions/${questionId}`)

export type QuestionApiData = Omit<Question, 'id' | 'aiPrompt' | 'workspaceGuid'> & {
    readonly aiGenerated?: boolean
    readonly questionType?: 'single' | 'multiple' | 'numerical'
}

export interface QuestionWriteResponse {
    readonly id: number
}

export const saveQuestion = async (workspaceGuid: string, question: QuestionApiData) =>
    await postJson<QuestionApiData, QuestionWriteResponse>(`/api/workspaces/${workspaceGuid}/questions`, question)

export const updateQuestion = async (workspaceGuid: string, questionId: number, question: QuestionApiData) =>
    await patchJson<QuestionApiData, QuestionWriteResponse>(
        `/api/workspaces/${workspaceGuid}/questions/${questionId}`,
        question,
    )

export const deleteQuestion = async (workspaceGuid: string, questionId: string) =>
    await callDelete(`/api/workspaces/${workspaceGuid}/questions/${questionId}`)
