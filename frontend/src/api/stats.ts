import type { QuestionAnswer, QuestionEvaluation } from '#model/question.ts'
import type { QuizSubmitRequest, QuizSubmitResponse } from '#model/quiz.ts'
import type { AttemptRequest, AttemptPatchRequest, AttemptResponse, QuizStatsResponse } from '#model/stats.ts'

import { fetchJson, patchJson, postJson, postNoContent, workspaceKeyHeaders } from './helpers.ts'

export const createAttempt = async (quizId: number, request: AttemptRequest): Promise<AttemptResponse> => {
    return await postJson<AttemptRequest, AttemptResponse>(`/api/quiz/${quizId}/attempts`, request)
}

export const patchAttempt = async (id: number, patch: AttemptPatchRequest): Promise<AttemptResponse> => {
    return await patchJson<AttemptPatchRequest, AttemptResponse>(`/api/attempt/${id}`, patch)
}

export const fetchQuizStats = async (workspaceGuid: string, quizId: string): Promise<QuizStatsResponse> => {
    return await fetchJson<QuizStatsResponse>(`/api/workspace/quizzes/${quizId}/stats`, {
        headers: workspaceKeyHeaders(workspaceGuid),
    })
}

export const submitQuiz = async (
    quizId: number,
    attemptId: number,
    request: QuizSubmitRequest,
): Promise<QuizSubmitResponse> =>
    await postJson<QuizSubmitRequest, QuizSubmitResponse>(`/api/quiz/${quizId}/attempts/${attemptId}/submit`, request)

export const submitQuizQuestionAnswer = async (
    quizId: number,
    attemptId: number,
    questionId: number,
    answer: QuestionAnswer,
): Promise<QuestionEvaluation> =>
    await postJson<QuestionAnswer, QuestionEvaluation>(
        `/api/quiz/${quizId}/attempts/${attemptId}/questions/${questionId}/submit`,
        answer,
    )

export const recordQuizQuestionAnswer = async (
    quizId: number,
    attemptId: number,
    questionId: number,
    answer: QuestionAnswer,
): Promise<void> =>
    await postNoContent<QuestionAnswer>(
        `/api/quiz/${quizId}/attempts/${attemptId}/questions/${questionId}/submit`,
        answer,
    )
