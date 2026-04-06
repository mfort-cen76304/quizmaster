export type AnswerIdxs = readonly number[]

export type QuestionType = 'single' | 'multiple' | 'numerical'

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

export interface AnswerComparison {
    readonly answered: boolean
    readonly missedCorrect: number
    readonly selectedIncorrect: number
}

export const compareNumericalAnswer = (
    userInput: string,
    correctAnswer: string,
    tolerance: number,
): AnswerComparison => {
    const user = Number.parseFloat(userInput.trim())
    const correct = Number.parseFloat(correctAnswer)
    if (Number.isNaN(user) || Number.isNaN(correct)) return { answered: false, missedCorrect: 1, selectedIncorrect: 0 }
    const isCorrect = Math.abs(user - correct) <= tolerance
    return { answered: true, missedCorrect: isCorrect ? 0 : 1, selectedIncorrect: isCorrect ? 0 : 1 }
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
