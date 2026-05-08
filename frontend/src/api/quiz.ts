import type { IdResponse } from '#shared/types/id-response.ts'
import type { Quiz, QuizAttemptStartResponse, QuizMetadata, QuizRequest, QuizTake } from '#shared/types/quiz.ts'

import { fetchJson, postJson, putJson, callDelete } from './helpers.ts'

export type { QuizRequest } from '#shared/types/quiz.ts'

export const fetchQuiz = async (quizId: string) => await fetchJson<QuizMetadata>(`/api/quiz/${quizId}`)

export const fetchQuizAttempt = async (quizId: number, attemptId: number) =>
    await fetchJson<QuizTake>(`/api/quiz/${quizId}/attempts/${attemptId}`)

export const createAttempt = async (quizId: number): Promise<QuizAttemptStartResponse> =>
    await postJson<undefined, QuizAttemptStartResponse>(`/api/quiz/${quizId}/attempts`, undefined)

export const createDryRun = async (workspaceGuid: string, quizId: number): Promise<QuizAttemptStartResponse> =>
    await postJson<undefined, QuizAttemptStartResponse>(
        `/api/workspaces/${workspaceGuid}/quizzes/${quizId}/dry-runs`,
        undefined,
    )

export const fetchWorkspaceQuiz = async (workspaceGuid: string, quizId: string) =>
    await fetchJson<Quiz>(`/api/workspaces/${workspaceGuid}/quizzes/${quizId}`)

export const postQuiz = async (quiz: QuizRequest, workspaceGuid: string) => {
    const response = await postJson<QuizRequest, IdResponse>(`/api/workspaces/${workspaceGuid}/quizzes`, quiz)
    return String(response.id)
}

export const putQuiz = async (quiz: QuizRequest, id: string, workspaceGuid: string) => {
    await putJson<QuizRequest, IdResponse>(`/api/workspaces/${workspaceGuid}/quizzes/${id}`, quiz)
}

export const deleteQuiz = async (workspaceGuid: string, quizId: string) =>
    await callDelete(`/api/workspaces/${workspaceGuid}/quizzes/${quizId}`)
