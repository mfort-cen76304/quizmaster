import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'

import { useApi } from '#api/hooks.ts'
import { createAttempt, fetchQuiz } from '#api/quiz.ts'
import { urls } from '#fe/urls.ts'
import type { QuizMetadata, QuizTake } from '#model/quiz.ts'

import { isQuizAvailable } from '../quiz-availability.ts'
import { storeQuizAnswers, setQuizRun } from '../quiz-session.ts'
import { QuizDetails } from './quiz-details.tsx'

export const QuizWelcomePage = () => {
    const navigate = useNavigate()
    const params = useParams()
    const [quiz, setQuiz] = useState<QuizMetadata>()
    const [isStarting, setIsStarting] = useState(false)

    useApi(params.id, fetchQuiz, setQuiz)

    const canStart = quiz ? isQuizAvailable(quiz) && !isStarting : false

    const onStart = async () => {
        if (!quiz || !canStart) return

        setIsStarting(true)
        storeQuizAnswers(null)

        try {
            const { attemptId, questions } = await createAttempt(quiz.id)
            const playableQuiz: QuizTake = { ...quiz, questions }
            setQuizRun(attemptId, quiz.id)
            navigate(urls.quizTake(quiz.id), { state: { quiz: playableQuiz } })
        } catch {
            setIsStarting(false)
        }
    }

    return quiz && <QuizDetails quiz={quiz} questionCount={quiz.questionCount} canStart={canStart} onStart={onStart} />
}
