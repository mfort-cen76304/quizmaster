import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'

import { useApi } from '#fe/shared/api/hooks.ts'
import type { QuizMetadata, QuizTake } from '#fe/shared/model/quiz.ts'
import { createAttempt, createDryRun, fetchQuiz } from '#fe/take/api/quiz.ts'
import { urls, useWorkspaceId } from '#fe/urls.ts'

import { DryRunIndicator } from '../dry-run-indicator.tsx'
import { isQuizAvailable } from '../quiz-availability.ts'
import { setQuizRun, storeQuizAnswers } from '../quiz-session.ts'
import { QuizDetails } from './quiz-details.tsx'

interface QuizWelcomePageProps {
    readonly isDryRun: boolean
}

const MOCKED_COHORT_LEADERBOARD = [
    { rank: 1, cohort: 'Team Rocket', score: 92 },
    { rank: 2, cohort: 'Scrum Ninjas', score: 88 },
    { rank: 3, cohort: 'Retro Masters', score: 75 },
] as const

const shouldShowMockedLeaderboard = import.meta.env.DEV || FEATURE_FLAG_ENABLED

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
                <QuizDetails
                    quiz={quiz}
                    questionCount={quiz.questionCount}
                    canStart={canStart}
                    cohortLeaderboard={shouldShowMockedLeaderboard ? MOCKED_COHORT_LEADERBOARD : []}
                    onStart={onStart}
                />
            </>
        )
    )
}
