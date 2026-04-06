import { createContext, useContext } from 'react'

import type { AnswerIdxs } from '#model/question.ts'
import type { Difficulty } from '#model/quiz.ts'

export interface QuizQuestionContextValue {
    readonly selectedAnswerIdxs: AnswerIdxs
    readonly onSubmitted: (selectedAnswerIdxs: AnswerIdxs) => void
    readonly onAnswerSelected: (selectedAnswerIdxs: AnswerIdxs) => void
    readonly showFeedbackOnSubmit: boolean
    readonly difficulty: Difficulty
}

const QuizQuestionContext = createContext<QuizQuestionContextValue | undefined>(undefined)

export const QuizQuestionProvider = QuizQuestionContext.Provider

export const useQuizQuestionContext = () => useContext(QuizQuestionContext)
