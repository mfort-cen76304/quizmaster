export type AnswerIdxs = readonly number[]

export type QuestionType = 'single' | 'multiple' | 'numerical'

export type QuestionAnswer =
    | { readonly type: 'choice'; readonly selectedIdxs: AnswerIdxs }
    | { readonly type: 'numerical'; readonly value: number }

export interface QuestionResult {
    readonly correct: boolean
    readonly score: number
}

export interface Question {
    readonly id: number
    readonly question: string
    readonly imageUrl?: string
    readonly tolerance?: number
    readonly answers: string[]
    readonly explanations: string[]
    readonly questionExplanation: string
    readonly correctAnswers: AnswerIdxs
    readonly questionType: QuestionType
    workspaceGuid: string | null
    isEasy: boolean
}

export interface Answers {
    readonly correctAnswers: AnswerIdxs
    readonly explanations: readonly string[]
    readonly questionExplanation: string
}

// Smart constructors. Return undefined when the input is not a valid answer
// (no choices selected, or numerical input that does not parse as a number).
// Callers test the result; do not pass undefined into evaluateAnswer.
export const choiceAnswer = (selectedIdxs: AnswerIdxs): QuestionAnswer | undefined =>
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

const scoreNumerical = (userValue: number, correctAnswer: string, tolerance: number): QuestionResult => {
    // Question data is trusted: correctAnswer is guaranteed parseable upstream.
    const correct = Number.parseFloat(correctAnswer)
    const inTolerance = Math.abs(userValue - correct) <= tolerance
    return { correct: inTolerance, score: inTolerance ? 1 : 0 }
}

interface ChoiceErrors {
    readonly missedCorrect: number
    readonly selectedIncorrect: number
}

const choiceErrors = (selected: AnswerIdxs, correct: AnswerIdxs): ChoiceErrors => {
    const correctSet = new Set(correct)
    const matched = selected.filter(i => correctSet.has(i)).length
    return {
        missedCorrect: correct.length - matched,
        selectedIncorrect: selected.length - matched,
    }
}

const scoreChoice = (selected: AnswerIdxs, correct: AnswerIdxs): QuestionResult => {
    const { missedCorrect, selectedIncorrect } = choiceErrors(selected, correct)
    if (missedCorrect === 0 && selectedIncorrect === 0) return { correct: true, score: 1 }
    if (missedCorrect + selectedIncorrect === 1) return { correct: false, score: 0.5 }
    return { correct: false, score: 0 }
}
