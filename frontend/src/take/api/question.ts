import { fetchJson, postJson } from '#fe/shared/api/helpers.ts'
import type { QuestionAnswer, QuestionEvaluation, QuestionTake } from '#fe/take/model/question.ts'

export const fetchQuestion = async (questionId: string) => await fetchJson<QuestionTake>(`/api/question/${questionId}`)

export const submitQuestionAnswer = async (questionId: string, answer: QuestionAnswer) =>
    await postJson<QuestionAnswer, QuestionEvaluation>(`/api/question/${questionId}/submit`, answer)
