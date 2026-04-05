export type AnswerIdxs = readonly number[]

export interface Question {
    readonly id: number
    readonly aiPrompt: string
    readonly question: string
    readonly imageUrl?: string
    readonly tolerance?: number
    readonly answers: string[]
    readonly explanations: string[]
    readonly questionExplanation: string
    readonly correctAnswers: AnswerIdxs
    workspaceGuid: string | null
    isEasy: boolean
}

export interface Answers {
    readonly correctAnswers: AnswerIdxs
    readonly explanations: readonly string[]
    readonly questionExplanation: string
}

export const isNumericalQuestion = (question: Question) => {
    const hasSingleCorrectAtZero = question.correctAnswers.length === 1 && question.correctAnswers[0] === 0
    if (!hasSingleCorrectAtZero) return false

    const normalizedAnswers = question.answers.map(answer => answer.trim())
    const firstAnswer = normalizedAnswers[0] ?? ''
    const hasNumericPrimaryAnswer = /^-?\d+(\.\d+)?$/.test(firstAnswer)
    const hasOnlyEmptySecondaryAnswers = normalizedAnswers.slice(1).every(answer => answer === '')

    return hasNumericPrimaryAnswer && hasOnlyEmptySecondaryAnswers
}

export interface AnswerComparison {
    readonly answered: boolean
    readonly missedCorrect: number
    readonly selectedIncorrect: number
}

export const compareAnswers = (selectedAnswerIdxs: AnswerIdxs, correctAnswers: AnswerIdxs): AnswerComparison => {
    if (!selectedAnswerIdxs) return { answered: false, missedCorrect: correctAnswers.length, selectedIncorrect: 0 }

    const selected = (predicate: (idx: number) => boolean) => selectedAnswerIdxs.filter(predicate).length

    const selectedCorrect = selected(idx => correctAnswers.includes(idx))
    const selectedIncorrect = selected(idx => !correctAnswers.includes(idx))

    return {
        answered: true,
        missedCorrect: correctAnswers.length - selectedCorrect,
        selectedIncorrect,
    }
}

export const isAnsweredCorrectly = ({ answered, missedCorrect, selectedIncorrect }: AnswerComparison): boolean =>
    answered && missedCorrect === 0 && selectedIncorrect === 0

export const calculateScore = (comparison: AnswerComparison): number => {
    if (!comparison.answered) return 0
    if (isAnsweredCorrectly(comparison)) return 1
    if (comparison.missedCorrect + comparison.selectedIncorrect === 1) return 0.5
    return 0
}
