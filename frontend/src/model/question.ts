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
    easyMode: boolean
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

export const isAnsweredCorrectly = (selectedAnswerIdxs: AnswerIdxs, correctAnswers: AnswerIdxs): boolean => {
    if (selectedAnswerIdxs) {
        return (
            selectedAnswerIdxs.length === correctAnswers.length &&
            selectedAnswerIdxs.every(answerIndex => correctAnswers.includes(answerIndex))
        )
    }
    return false
}
