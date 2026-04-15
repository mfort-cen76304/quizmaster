import type { QuizAnswers } from './quiz-answers-state.ts'

const QUIZ_ANSWERS_KEY = 'quizAnswers'

const quizRunIdKey = (quizId: number) => `quizRunId:${quizId}`

export const setQuizRun = (runId: number, quizId: number) => {
    sessionStorage.setItem(quizRunIdKey(quizId), runId.toString())
}

export const clearQuizRun = (quizId: number) => sessionStorage.removeItem(quizRunIdKey(quizId))

export const getStoredQuizRunId = (quizId: number): number | null => {
    const storedRunId = sessionStorage.getItem(quizRunIdKey(quizId))

    if (!storedRunId) return null

    const runId = Number.parseInt(storedRunId, 10)
    return Number.isNaN(runId) ? null : runId
}

export const loadQuizAnswers = (): QuizAnswers | null => {
    const storedAnswers = sessionStorage.getItem(QUIZ_ANSWERS_KEY)
    if (!storedAnswers) return null

    try {
        return JSON.parse(storedAnswers) as QuizAnswers
    } catch {
        sessionStorage.removeItem(QUIZ_ANSWERS_KEY)
        return null
    }
}

export const storeQuizAnswers = (answers: QuizAnswers | null) => {
    if (answers === null) {
        sessionStorage.removeItem(QUIZ_ANSWERS_KEY)
        return
    }

    sessionStorage.setItem(QUIZ_ANSWERS_KEY, JSON.stringify(answers))
}

export const clearQuizTakeSession = (quizId: number) => {
    clearQuizRun(quizId)
    storeQuizAnswers(null)
}
