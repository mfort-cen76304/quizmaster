export type { AnswerIdxs, QuestionType } from '#fe/shared/model/question.ts'
export type {
    AnswerStatus,
    Question,
    QuestionDraft,
    QuestionEvaluation,
    QuestionTake,
} from '#fe/shared/model/question.ts'
export { countDecimalDigits } from '#fe/shared/model/question.ts'

export type QuestionAnswer =
    | { readonly type: 'choice'; readonly selectedIdxs: readonly number[] }
    | { readonly type: 'numerical'; readonly value: number }

// Smart constructors. Return undefined when the input is not a valid answer
// (no choices selected, or numerical input that does not parse as a number).
export const choiceAnswer = (selectedIdxs: readonly number[]): QuestionAnswer | undefined =>
    selectedIdxs.length === 0 ? undefined : { type: 'choice', selectedIdxs }

export const numericalAnswer = (input: string): QuestionAnswer | undefined => {
    const value = Number.parseFloat(input.trim())
    return Number.isNaN(value) ? undefined : { type: 'numerical', value }
}
