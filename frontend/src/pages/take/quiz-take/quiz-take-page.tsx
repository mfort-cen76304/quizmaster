import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'

import { patchAttempt } from '#api/stats.ts'
import { urls } from '#fe/urls.ts'

import { useQuizApi } from './hooks.ts'
import type { QuizAnswers } from './quiz-answers-state.ts'
import { isQuizAvailable } from './quiz-availability.ts'
import { QuizScorePage } from './quiz-score-page.tsx'
import { clearQuizTakeSession, getStoredQuizRunId, loadQuizAnswers, storeQuizAnswers } from './quiz-session.ts'
import { QuestionForm } from './quiz.tsx'

export const QuizTakePage = () => {
    const quiz = useQuizApi()
    const [quizAnswers, setQuizAnswers] = useState<QuizAnswers | null>(() => loadQuizAnswers())
    const navigate = useNavigate()
    const isAvailable = quiz ? isQuizAvailable(quiz) : false
    const quizRunId = quiz ? getStoredQuizRunId(quiz.id) : null
    const canTakeQuiz = quiz !== undefined && isAvailable && quizRunId !== null

    useEffect(() => {
        if (!quiz) return
        if (canTakeQuiz) return

        clearQuizTakeSession(quiz.id)
        navigate(urls.quizWelcome(quiz.id), { replace: true })
    }, [canTakeQuiz, navigate, quiz])

    async function handleEvaluate(answers: QuizAnswers | null) {
        if (!quiz) return

        navigate(urls.quizTake(quiz.id))
        storeQuizAnswers(answers)
        setQuizAnswers(answers)

        if (!answers || quizRunId === null) return

        await patchAttempt(quizRunId, {
            finishedAt: new Date().toISOString(),
        })
    }

    if (quiz && quizRunId !== null && isAvailable) {
        return quizAnswers ? (
            <QuizScorePage quiz={quiz} quizAnswers={quizAnswers} />
        ) : (
            <QuestionForm quiz={quiz} quizRunId={quizRunId} onEvaluate={handleEvaluate} />
        )
    }
}
