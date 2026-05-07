import { useState, useEffect } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router'

import { evaluateQuiz } from '#api/stats.ts'
import { urls } from '#fe/urls.ts'
import type { QuizEvaluationResponse, QuizTake } from '#model/quiz.ts'

import { useQuizAttemptApi } from './hooks.ts'
import type { QuizAnswers } from './quiz-answers-state.ts'
import { isQuizAvailable } from './quiz-availability.ts'
import { QuizPlayForm } from './quiz-play.tsx'
import { QuizScorePage } from './quiz-score-page.tsx'
import { clearQuizTakeSession, getStoredQuizRunId, loadQuizAnswers, storeQuizAnswers } from './quiz-session.ts'

export const QuizTakePage = () => {
    const params = useParams()
    const location = useLocation()
    const navigate = useNavigate()
    const quizId = params.id ? Number(params.id) : null
    const [initialStateQuiz] = useState<QuizTake | undefined>(
        () => (location.state as { quiz?: QuizTake } | null)?.quiz,
    )
    const quizRunId = quizId !== null ? getStoredQuizRunId(quizId) : null
    const fetchedQuiz = useQuizAttemptApi(initialStateQuiz ? null : quizRunId)
    const quiz = initialStateQuiz ?? fetchedQuiz
    const [quizAnswers, setQuizAnswers] = useState<QuizAnswers | null>(() => loadQuizAnswers())
    const [scoredQuiz, setScoredQuiz] = useState<QuizEvaluationResponse | null>(null)
    const isAvailable = quiz ? isQuizAvailable(quiz) : false
    const canTakeQuiz = quiz !== undefined && isAvailable && quizRunId !== null

    useEffect(() => {
        if (quizId === null) return
        if (canTakeQuiz) return
        if (quizRunId !== null && quiz === undefined) return

        clearQuizTakeSession(quizId)
        navigate(urls.quizWelcome(quizId), { replace: true })
    }, [quizId, canTakeQuiz, navigate, quiz, quizRunId])

    async function handleEvaluate(answers: QuizAnswers | null, timedOut = false) {
        if (!quiz) return

        navigate(urls.quizTake(quiz.id))
        storeQuizAnswers(answers)
        setQuizAnswers(answers)

        if (!answers || quizRunId === null) return

        const response = await evaluateQuiz(quiz.id, quizRunId, {
            questionIds: quiz.questions.map(question => question.id),
            answers: quiz.questions.flatMap((question, index) => {
                const answer = answers.finalAnswers[index]
                return answer ? [{ ...answer, questionId: question.id }] : []
            }),
            finishedAt: new Date().toISOString(),
            timedOutAt: timedOut ? new Date().toISOString() : undefined,
        })
        setScoredQuiz(response)
    }

    if (quiz && quizRunId !== null && isAvailable) {
        return quizAnswers && scoredQuiz ? (
            <QuizScorePage quiz={quiz} quizAnswers={quizAnswers} result={scoredQuiz} />
        ) : (
            <QuizPlayForm
                quiz={quiz}
                quizRunId={quizRunId}
                questionsBaseUrl={urls.quizTake(quiz.id)}
                onEvaluate={handleEvaluate}
            />
        )
    }
}
