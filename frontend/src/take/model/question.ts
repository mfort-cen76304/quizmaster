import type { AnswerStatus, Question } from '#fe/shared/model/question.ts'

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

export interface QuestionResult {
    readonly status: AnswerStatus
    readonly score: number
}

// Smart constructors. Return undefined when the input is not a valid answer
// (no choices selected, or numerical input that does not parse as a number).
// Callers test the result; do not pass undefined into evaluateAnswer.
export const choiceAnswer = (selectedIdxs: readonly number[]): QuestionAnswer | undefined =>
    selectedIdxs.length === 0 ? undefined : { type: 'choice', selectedIdxs }

export const numericalAnswer = (input: string): QuestionAnswer | undefined => {
    const value = Number.parseFloat(input.trim())
    return Number.isNaN(value) ? undefined : { type: 'numerical', value }
}

// Single public scoring entry point. Always called with a real answer;
// "no answer" is the caller's concern, not a result we manufacture here.
export const evaluateAnswer = (question: Question, answer: QuestionAnswer): QuestionResult =>
    answer.type === 'numerical'
        ? scoreNumerical(answer.value, question.answers[0], question.tolerance ?? 0)
        : scoreChoice(answer.selectedIdxs, question.correctAnswers)

// --- private ---

// Tiny slack on the tolerance comparison to absorb IEEE 754 noise:
// e.g. Math.abs(3.13 - 3.14) is actually 0.010000000000000231, not 0.01,
// which would otherwise reject a value sitting exactly on a 0.01 boundary.
// 1e-9 is far larger than typical accumulation error for quiz-scale values
// and far smaller than any meaningful tolerance. See backlog/numerical-question.md.
const FLOAT_EPSILON = 1e-9

const scoreNumerical = (userValue: number, correctAnswer: string, tolerance: number): QuestionResult => {
    // Question data is trusted: correctAnswer is guaranteed parseable upstream.
    const correct = Number.parseFloat(correctAnswer)
    const inTolerance = Math.abs(userValue - correct) <= tolerance + FLOAT_EPSILON
    return inTolerance ? { status: 'CORRECT', score: 1 } : { status: 'INCORRECT', score: 0 }
}

interface ChoiceErrors {
    readonly missedCorrect: number
    readonly selectedIncorrect: number
}

const choiceErrors = (selected: readonly number[], correct: readonly number[]): ChoiceErrors => {
    const correctSet = new Set(correct)
    const matched = selected.filter(i => correctSet.has(i)).length
    return {
        missedCorrect: correct.length - matched,
        selectedIncorrect: selected.length - matched,
    }
}

const scoreChoice = (selected: readonly number[], correct: readonly number[]): QuestionResult => {
    const { missedCorrect, selectedIncorrect } = choiceErrors(selected, correct)
    if (missedCorrect === 0 && selectedIncorrect === 0) return { status: 'CORRECT', score: 1 }
    if (missedCorrect + selectedIncorrect === 1) return { status: 'PARTIAL', score: 0.5 }
    return { status: 'INCORRECT', score: 0 }
}
