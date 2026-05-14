import { postJson, postNoContent } from '#fe/shared/api/helpers.ts'
import type { QuizEvaluationResponse } from '#fe/shared/model/quiz.ts'
import type { QuestionAnswer, QuestionEvaluation } from '#fe/take/model/question.ts'
export const recordTimeout = async (quizId: number, attemptId: number): Promise<void> =>
    await postNoContent(`/api/quiz/${quizId}/attempts/${attemptId}/timeout`)
export const evaluateQuiz = async (quizId: number, attemptId: number): Promise<QuizEvaluationResponse> =>
    await postJson<void, QuizEvaluationResponse>(`/api/quiz/${quizId}/attempts/${attemptId}/evaluate`)
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
