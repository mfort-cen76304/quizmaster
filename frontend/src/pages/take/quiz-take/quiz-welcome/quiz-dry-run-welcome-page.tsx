import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'

import { useApi } from '#api/hooks.ts'
import { fetchWorkspaceQuiz } from '#api/quiz.ts'
import { urls, useWorkspaceId } from '#fe/urls.ts'
import type { Quiz } from '#model/quiz.ts'

import { DryRunIndicator } from '../dry-run-indicator.tsx'
import { QuizDetails } from './quiz-details.tsx'

export const QuizDryRunWelcomePage = () => {
    const navigate = useNavigate()
    const params = useParams()
    const workspaceId = useWorkspaceId()
    const [quiz, setQuiz] = useState<Quiz>()

    useApi(params.id, id => fetchWorkspaceQuiz(workspaceId, id), setQuiz)

    const onStart = () => {
        if (!quiz) return
        navigate(urls.workspaceQuizDryRunTake(workspaceId, quiz.id))
    }

    return (
        quiz && (
            <>
                <DryRunIndicator />
                <QuizDetails
                    quiz={quiz}
                    questionCount={quiz.randomQuestionCount || quiz.questions.length}
                    canStart={true}
                    onStart={onStart}
                />
            </>
        )
    )
}
