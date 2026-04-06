import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'

import { patchAttempt } from '#api/stats.ts'
import { getQuizRunId } from '#fe/helpers.ts'

import { useQuizApi } from './hooks.ts'
import type { QuizAnswers } from './quiz-answers-state.ts'
import { QuizScorePage } from './quiz-score-page.tsx'
import { QuestionForm } from './quiz.tsx'

export const QuizTakePage = () => {
    const quiz = useQuizApi()
    const [quizAnswers, setQuizAnswers] = useState<QuizAnswers | null>(null)
    const navigate = useNavigate()

    useEffect(() => {
        const stored = sessionStorage.getItem('quizAnswers')
        if (stored) {
            setQuizAnswers(JSON.parse(stored))
        }
    }, [])

    function updateSessionStorage(answers: QuizAnswers | null) {
        if (answers !== null) {
            sessionStorage.setItem('quizAnswers', JSON.stringify(answers))
        } else {
            sessionStorage.removeItem('quizAnswers')
        }
    }

    async function handleEvaluate(answers: QuizAnswers | null) {
        navigate(`/quiz/${quiz?.id}/questions`)
        updateSessionStorage(answers)
        setQuizAnswers(answers)

        if (!quiz || !answers) return

        await patchAttempt(getQuizRunId(), {
            finishedAt: new Date().toISOString(),
        })
    }

    if (quiz) {
        return quizAnswers ? (
            <QuizScorePage quiz={quiz} quizAnswers={quizAnswers} />
        ) : (
            <QuestionForm quiz={quiz} onEvaluate={handleEvaluate} />
        )
    }
}
