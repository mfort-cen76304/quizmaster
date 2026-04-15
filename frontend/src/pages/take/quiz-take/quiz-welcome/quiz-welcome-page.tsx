import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'

import { useApi } from '#api/hooks.ts'
import { fetchQuiz } from '#api/quiz.ts'
import { createAttempt } from '#api/stats.ts'
import { urls } from '#fe/urls.ts'
import type { Quiz } from '#model/quiz.ts'

import { isQuizAvailable } from '../quiz-availability.ts'
import { storeQuizAnswers, setQuizRun } from '../quiz-session.ts'
import { QuizDetails } from './quiz-details.tsx'

export const QuizWelcomePage = () => {
    const navigate = useNavigate()
    const params = useParams()
    const [quiz, setQuiz] = useState<Quiz>()
    const [isStarting, setIsStarting] = useState(false)

    useApi(params.id, fetchQuiz, setQuiz)

    const canStart = quiz ? isQuizAvailable(quiz) && !isStarting : false

    const onStart = async () => {
        if (!quiz || !canStart) return

        setIsStarting(true)
        storeQuizAnswers(null)

        try {
            const attempt = await createAttempt({
                quizId: quiz.id,
                startedAt: new Date().toISOString(),
            })
            setQuizRun(attempt.id, quiz.id)
            navigate(urls.quizTake(quiz.id))
        } catch {
            setIsStarting(false)
        }
    }

    return quiz && <QuizDetails quiz={quiz} canStart={canStart} onStart={onStart} />
}
