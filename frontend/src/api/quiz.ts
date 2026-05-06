import type { IdResponse } from '#shared/types/id-response.ts'
import type { Quiz, QuizRequest, QuizTake } from '#shared/types/quiz.ts'

import { fetchJson, postJson, putJson, callDelete, workspaceKeyHeaders } from './helpers.ts'

export type { QuizRequest } from '#shared/types/quiz.ts'

export const fetchQuiz = async (quizId: string) => await fetchJson<QuizTake>(`/api/quiz/${quizId}`)

export const fetchQuizAttempt = async (quizId: number, attemptId: number) =>
    await fetchJson<QuizTake>(`/api/quiz/${quizId}/attempts/${attemptId}`)

export const fetchWorkspaceQuiz = async (workspaceGuid: string, quizId: string) =>
    await fetchJson<Quiz>(`/api/workspace/quizzes/${quizId}`, { headers: workspaceKeyHeaders(workspaceGuid) })

export const postQuiz = async (quiz: QuizRequest, workspaceGuid: string) => {
    const response = await postJson<QuizRequest, IdResponse>('/api/workspace/quizzes', quiz, {
        headers: workspaceKeyHeaders(workspaceGuid),
    })
    return String(response.id)
}

export const putQuiz = async (quiz: QuizRequest, id: string, workspaceGuid: string) => {
    await putJson<QuizRequest, IdResponse>(`/api/workspace/quizzes/${id}`, quiz, {
        headers: workspaceKeyHeaders(workspaceGuid),
    })
}

export const deleteQuiz = async (workspaceGuid: string, quizId: string) =>
    await callDelete(`/api/workspace/quizzes/${quizId}`, { headers: workspaceKeyHeaders(workspaceGuid) })
