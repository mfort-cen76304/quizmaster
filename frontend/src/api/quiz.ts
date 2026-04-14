import type { Quiz, QuizMode, Difficulty } from '#model/quiz.ts'

import { fetchJson, postJson, putJson, callDelete } from './helpers.ts'

export interface QuizCreateRequest {
    readonly title: string
    readonly description: string
    readonly startAt: string | null
    readonly endAt: string | null
    readonly questionIds: readonly number[]
    readonly mode: QuizMode
    readonly difficulty: Difficulty
    readonly passScore: number
    readonly timeLimit: number
    readonly workspaceGuid: string | null
    readonly randomQuestionCount?: number
}

export const fetchQuiz = async (quizId: string) => await fetchJson<Quiz>(`/api/quiz/${quizId}`)

interface QuizWriteResponse {
    readonly id: number
}

export const postQuiz = async (quiz: QuizCreateRequest, workspaceGuid: string) => {
    const response = await postJson<QuizCreateRequest, QuizWriteResponse>(
        `/api/workspaces/${workspaceGuid}/quizzes`,
        quiz,
    )
    return String(response.id)
}

export const putQuiz = async (quiz: QuizCreateRequest, id: string, workspaceGuid: string) => {
    await putJson<QuizCreateRequest, QuizWriteResponse>(`/api/workspaces/${workspaceGuid}/quizzes/${id}`, quiz)
}

export const deleteQuiz = async (workspaceGuid: string, quizId: string) =>
    await callDelete(`/api/workspaces/${workspaceGuid}/quizzes/${quizId}`)
