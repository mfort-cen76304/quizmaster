export type { AnswerIdxs, QuestionType } from '#shared/types/enums.ts'
export type { AnswerStatus, Question, QuestionDraft, QuestionEvaluation, QuestionTake } from '#shared/types/question.ts'

export const countDecimalDigits = (answer: string): number => {
    const dotIndex = answer.indexOf('.')
    if (dotIndex === -1) return 0
    return Math.max(0, answer.length - dotIndex - 1)
}
