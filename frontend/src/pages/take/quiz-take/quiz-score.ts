import { type Question, type QuestionAnswer, type QuestionResult, evaluateAnswer } from '#model/question.ts'
import type { Quiz } from '#model/quiz.ts'

import type { QuizAnswers } from './quiz-answers-state'

export interface QuizScore {
    readonly correct: number
    readonly firstCorrect: number
    readonly total: number
    readonly score: number
}

// Unanswered questions don't get evaluated; the caller decides what absence
// means (here: doesn't contribute to score, doesn't count as correct).
const evalOrSkip = (question: Question, answer: QuestionAnswer | undefined): QuestionResult | undefined =>
    answer && evaluateAnswer(question, answer)

export const evaluate = (quiz: Quiz, quizAnswers: QuizAnswers): QuizScore => {
    const finalResults = quiz.questions.map((q, i) => evalOrSkip(q, quizAnswers.finalAnswers[i]))
    const firstResults = quiz.questions.map((q, i) => evalOrSkip(q, quizAnswers.firstAnswers[i]))

    return {
        correct: finalResults.filter(r => r?.correct).length,
        firstCorrect: firstResults.filter(r => r?.correct).length,
        total: quiz.questions.length,
        score: finalResults.reduce((sum, r) => sum + (r?.score ?? 0), 0),
    }
}
