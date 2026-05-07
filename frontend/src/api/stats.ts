import type { QuestionAnswer, QuestionEvaluation } from '#model/question.ts'
import type { QuizEvaluationRequest, QuizEvaluationResponse } from '#model/quiz.ts'
import type { AttemptRequest, AttemptResponse, QuizStatsResponse } from '#model/stats.ts'

import { fetchJson, postJson, postNoContent } from './helpers.ts'

export const createAttempt = async (quizId: number, request: AttemptRequest): Promise<AttemptResponse> => {
    return await postJson<AttemptRequest, AttemptResponse>(`/api/quiz/${quizId}/attempts`, request)
}

export const recordTimeout = async (quizId: number, attemptId: number): Promise<void> =>
    await postNoContent(`/api/quiz/${quizId}/attempts/${attemptId}/timeout`)

export const fetchQuizStats = async (workspaceGuid: string, quizId: string): Promise<QuizStatsResponse> => {
    return await fetchJson<QuizStatsResponse>(`/api/workspaces/${workspaceGuid}/quizzes/${quizId}/stats`)
}

export const evaluateQuiz = async (
    quizId: number,
    attemptId: number,
    request: QuizEvaluationRequest,
): Promise<QuizEvaluationResponse> =>
    await postJson<QuizEvaluationRequest, QuizEvaluationResponse>(
        `/api/quiz/${quizId}/attempts/${attemptId}/evaluate`,
        request,
    )

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
