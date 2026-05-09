import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'

import { useApi } from '#fe/api/hooks.ts'
import { createAttempt, createDryRun, fetchQuiz } from '#fe/api/quiz.ts'
import type { QuizMetadata, QuizTake } from '#fe/model/quiz.ts'
import { urls, useWorkspaceId } from '#fe/urls.ts'

import { DryRunIndicator } from '../dry-run-indicator.tsx'
import { isQuizAvailable } from '../quiz-availability.ts'
import { setQuizRun, storeQuizAnswers } from '../quiz-session.ts'
import { QuizDetails } from './quiz-details.tsx'

interface QuizWelcomePageProps {
    readonly isDryRun: boolean
}

export const QuizWelcomePage = ({ isDryRun }: QuizWelcomePageProps) => {
    const navigate = useNavigate()
    const params = useParams()
    const workspaceId = useWorkspaceId()
    const [quiz, setQuiz] = useState<QuizMetadata>()
    const [isStarting, setIsStarting] = useState(false)

    useApi(params.id, fetchQuiz, setQuiz)

    const canStart = quiz ? !isStarting && (isDryRun || isQuizAvailable(quiz)) : false

    const onStart = async () => {
        if (!quiz || !canStart) return

        setIsStarting(true)
        storeQuizAnswers(null)

        try {
            const { attemptId, questions } = isDryRun
                ? await createDryRun(workspaceId, quiz.id)
                : await createAttempt(quiz.id)
            const playableQuiz: QuizTake = { ...quiz, questions }
            setQuizRun(attemptId, quiz.id)
            const target = isDryRun ? urls.workspaceQuizDryRunTake(workspaceId, quiz.id) : urls.quizTake(quiz.id)
            navigate(target, { state: { quiz: playableQuiz } })
        } catch {
            setIsStarting(false)
        }
    }

    return (
        quiz && (
            <>
                {isDryRun && <DryRunIndicator />}
                <QuizDetails quiz={quiz} questionCount={quiz.questionCount} canStart={canStart} onStart={onStart} />
            </>
        )
    )
}
