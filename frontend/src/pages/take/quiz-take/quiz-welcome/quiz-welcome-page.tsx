import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'

import { useApi } from '#api/hooks.ts'
import { fetchQuiz } from '#api/quiz.ts'
import { createAttempt } from '#api/stats.ts'
import { setQuizRunId } from '#fe/helpers.ts'
import type { Quiz } from '#model/quiz.ts'
import { AttemptStatus } from '#model/stats.ts'

import { QuizDetails } from './quiz-details.tsx'

export const QuizWelcomePage = () => {
    const navigate = useNavigate()
    const params = useParams()
    const [quiz, setQuiz] = useState<Quiz>()

    useApi(params.id, fetchQuiz, setQuiz)

    const onStart = async () => {
        const quizId = params.id
        navigate(`/quiz/${quizId}/questions`)
        sessionStorage.removeItem('quizAnswers')

        if (quiz) {
            const startTime = new Date()
            const attempt = await createAttempt({
                quizId: quiz.id,
                durationSeconds: 0,
                points: 0,
                score: 0,
                status: AttemptStatus.IN_PROGRESS,
                maxScore: 0,
                startedAt: startTime.toISOString(),
                finishedAt: null,
            })
            setQuizRunId(attempt.id)
            // Store start time in sessionStorage for duration calculation
            sessionStorage.setItem('quizStartTime', startTime.getTime().toString())
        }
    }

    return quiz && <QuizDetails quiz={quiz} onStart={onStart} />
}
