export interface Answer {
    answer: string
    isCorrect: boolean
    explanation: string | undefined
}

export const emptyAnswer = (): Answer => ({ answer: '', isCorrect: false, explanation: undefined })

export interface Question {
    question: string
    answers: Answer[]
    explanation: string
    imageUrl?: string
    isNumerical?: boolean
}

export const emptyQuestion = (): Question => ({ question: '', answers: [], explanation: '' })
