import { useState } from 'react'
import { useNavigate } from 'react-router'

import { urls, useWorkspaceId } from '#fe/urls.ts'

import { DryRunIndicator } from './dry-run-indicator.tsx'
import { useWorkspaceQuizApi } from './hooks.ts'
import type { QuizAnswers } from './quiz-answers-state.ts'
import { QuizScorePage } from './quiz-score-page.tsx'
import { storeQuizAnswers } from './quiz-session.ts'
import { QuestionForm } from './quiz.tsx'

export const QuizDryRunTakePage = () => {
    const workspaceId = useWorkspaceId()
    const quiz = useWorkspaceQuizApi(workspaceId)
    const [quizAnswers, setQuizAnswers] = useState<QuizAnswers | null>(null)
    const navigate = useNavigate()

    const handleEvaluate = (answers: QuizAnswers | null) => {
        if (!quiz) return
        navigate(urls.workspaceQuizDryRunTake(workspaceId, quiz.id))
        storeQuizAnswers(answers)
        setQuizAnswers(answers)
    }

    if (!quiz) return null

    const questionsBaseUrl = urls.workspaceQuizDryRunTake(workspaceId, quiz.id)

    return (
        <>
            <DryRunIndicator />
            {quizAnswers ? (
                <QuizScorePage quiz={quiz} quizAnswers={quizAnswers} />
            ) : (
                <QuestionForm
                    quiz={quiz}
                    quizRunId={null}
                    questionsBaseUrl={questionsBaseUrl}
                    onEvaluate={handleEvaluate}
                />
            )}
        </>
    )
}
