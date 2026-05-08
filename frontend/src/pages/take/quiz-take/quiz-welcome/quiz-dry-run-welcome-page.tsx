import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'

import { useApi } from '#api/hooks.ts'
import { createDryRun, fetchQuiz } from '#api/quiz.ts'
import { urls, useWorkspaceId } from '#fe/urls.ts'
import type { QuizMetadata, QuizTake } from '#model/quiz.ts'

import { DryRunIndicator } from '../dry-run-indicator.tsx'
import { setQuizRun, storeQuizAnswers } from '../quiz-session.ts'
import { QuizDetails } from './quiz-details.tsx'

export const QuizDryRunWelcomePage = () => {
    const navigate = useNavigate()
    const params = useParams()
    const workspaceId = useWorkspaceId()
    const [quiz, setQuiz] = useState<QuizMetadata>()
    const [isStarting, setIsStarting] = useState(false)

    useApi(params.id, fetchQuiz, setQuiz)

    const onStart = async () => {
        if (!quiz || isStarting) return

        setIsStarting(true)
        storeQuizAnswers(null)

        try {
            const { attemptId, questions } = await createDryRun(workspaceId, quiz.id)
            const playableQuiz: QuizTake = { ...quiz, questions }
            setQuizRun(attemptId, quiz.id)
            navigate(urls.workspaceQuizDryRunTake(workspaceId, quiz.id), { state: { quiz: playableQuiz } })
        } catch {
            setIsStarting(false)
        }
    }

    return (
        quiz && (
            <>
                <DryRunIndicator />
                <QuizDetails quiz={quiz} questionCount={quiz.questionCount} canStart={!isStarting} onStart={onStart} />
            </>
        )
    )
}
