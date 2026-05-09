import type { QuizAttemptStartResponse, QuizMetadata, QuizTake } from '#fe/model/quiz.ts'
import { fetchJson, postJson } from '#fe/shared/api/helpers.ts'

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
