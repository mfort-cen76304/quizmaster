import { compareAnswers, isAnsweredCorrectly, calculateScore } from '#model/question.ts'
import type { Quiz } from '#model/quiz.ts'

import type { QuizAnswers } from './quiz-answers-state'

export interface QuizScore {
    readonly correct: number
    readonly firstCorrect: number
    readonly total: number
    readonly score: number
}

export const evaluate = (quiz: Quiz, quizAnswers: QuizAnswers): QuizScore => {
    const comparisons = quiz.questions.map((question, idx) =>
        compareAnswers(quizAnswers.finalAnswers[idx], question.correctAnswers),
    )

    return {
        correct: comparisons.filter(isAnsweredCorrectly).length,
        firstCorrect: quiz.questions.filter((question, idx) =>
            isAnsweredCorrectly(compareAnswers(quizAnswers.firstAnswers[idx], question.correctAnswers)),
        ).length,
        total: quiz.questions.length,
        score: comparisons.map(calculateScore).reduce((a, b) => a + b, 0),
    }
}
