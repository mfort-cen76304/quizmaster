import { useNavigate, useParams } from 'react-router'

import { useStateSet } from '#fe/shared/helpers.ts'
import type { QuizTake } from '#fe/shared/model/quiz.ts'

export interface QuizNavigationState {
    readonly currentQuestionIdx: number
    readonly isFirstQuestion: boolean
    readonly isLastQuestion: boolean
    readonly skippedQuestions: ReadonlySet<number>
    readonly goto: (questionIdx: number) => void
    readonly canBack: boolean
    readonly canNext: boolean
    readonly canSkip: boolean
    readonly next: () => void
    readonly back: () => void
    readonly skip: () => void
    readonly unskip: () => void
}

export const useQuizNavigationState = (quiz: QuizTake, questionsBaseUrl: string): QuizNavigationState => {
    const { questionId } = useParams()

    const navigate = useNavigate()

    const currentQuestionIdx = !questionId ? 0 : Number(questionId)

    const [skippedQuestions, , addSkippedQuestion, removeSkippedQuestion] = useStateSet<number>()

    const isFirstQuestion = currentQuestionIdx === 0
    const isLastQuestion = currentQuestionIdx === quiz.questions.length - 1

    const next = () => {
        if (isLastQuestion) {
            navigate(questionsBaseUrl)
        } else {
            navigate(`${questionsBaseUrl}/${currentQuestionIdx + 1}`)
        }
    }

    const canNext = !isLastQuestion || skippedQuestions.size > 0
    const canSkip = !isLastQuestion

    const skip = () => {
        addSkippedQuestion(currentQuestionIdx)
        next()
    }

    const unskip = () => {
        removeSkippedQuestion(currentQuestionIdx)
    }

    const canBack = currentQuestionIdx > 0

    const back = () => navigate(`${questionsBaseUrl}/${currentQuestionIdx - 1}`)

    return {
        currentQuestionIdx,
        isFirstQuestion,
        isLastQuestion,
        skippedQuestions,
        goto: (questionIdx: number) => navigate(`${questionsBaseUrl}/${questionIdx}`),
        canNext,
        canSkip,
        canBack,
        next,
        back,
        skip,
        unskip,
    }
}
