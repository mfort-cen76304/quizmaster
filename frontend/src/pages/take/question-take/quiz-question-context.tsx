import { createContext, useContext } from 'react'

import type { AnswerIdxs, QuestionAnswer, QuestionEvaluation } from '#fe/model/question.ts'
import type { Difficulty } from '#fe/model/quiz.ts'

export interface QuizQuestionContextValue {
    readonly selectedAnswerIdxs: AnswerIdxs
    readonly onSubmitted: (answer: QuestionAnswer) => void | Promise<QuestionEvaluation | void>
    readonly onAnswerSelected: (selectedAnswerIdxs: AnswerIdxs) => void
    readonly showFeedbackOnSubmit: boolean
    readonly difficulty: Difficulty
}

const QuizQuestionContext = createContext<QuizQuestionContextValue | undefined>(undefined)

export const QuizQuestionProvider = QuizQuestionContext.Provider

export const useQuizQuestionContext = () => useContext(QuizQuestionContext)
