import { useState } from 'react'

import { updated } from '#fe/helpers.ts'
import type { QuestionAnswer } from '#fe/take/model/question.ts'

export type QuizAnswers = {
    readonly firstAnswers: readonly QuestionAnswer[]
    readonly finalAnswers: readonly QuestionAnswer[]
}

export interface QuizAnswersState {
    readonly quizAnswers: QuizAnswers
    readonly answerQuestion: (questionIdx: number, answer: QuestionAnswer) => void
}

export const useQuizAnswersState = (): QuizAnswersState => {
    const [firstAnswers, setFirstAnswers] = useState<readonly QuestionAnswer[]>([])
    const [finalAnswers, setFinalAnswers] = useState<readonly QuestionAnswer[]>([])

    const answerQuestion = (questionIdx: number, answer: QuestionAnswer) => {
        if (firstAnswers[questionIdx] === undefined) setFirstAnswers(updated(firstAnswers, questionIdx, answer))

        setFinalAnswers(updated(finalAnswers, questionIdx, answer))
    }

    return { quizAnswers: { firstAnswers, finalAnswers }, answerQuestion }
}
