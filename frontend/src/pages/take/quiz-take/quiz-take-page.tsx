import { useState, useEffect, useMemo } from 'react'

import { useQuizApi } from './hooks.ts'

import { QuizScorePage } from './quiz-score-page.tsx'
import { QuestionForm } from './quiz.tsx'
import type { QuizAnswers } from './quiz-answers-state.ts'
import { useNavigate } from 'react-router-dom'
import { updateAttempt } from 'api/stats.ts'
import { getQuizRunId } from 'helpers.ts'
import { evaluate } from './quiz-score.ts'
import { AttemptStatus } from 'model/stats.ts'

export const QuizTakePage = () => {
    const quiz = useQuizApi()
    const [quizAnswers, setQuizAnswers] = useState<QuizAnswers | null>(null)
    const [retakeQuestionIds, setRetakeQuestionIds] = useState<number[] | null>(null)
    const navigate = useNavigate()

    useEffect(() => {
        const stored = sessionStorage.getItem('quizAnswers')
        if (stored) {
            setQuizAnswers(JSON.parse(stored))
        }
        const storedRetake = sessionStorage.getItem('retakeQuestionIds')
        if (storedRetake) {
            setRetakeQuestionIds(JSON.parse(storedRetake))
        }
    }, [])

    function updateSessionStorage(answers: QuizAnswers | null) {
        if (answers !== null) {
            sessionStorage.setItem('quizAnswers', JSON.stringify(answers))
        } else {
            sessionStorage.removeItem('quizAnswers')
        }
    }

    function handleRetakeIncorrect(incorrectQuestionIds: number[]) {
        updateSessionStorage(null)
        setQuizAnswers(null)
        sessionStorage.setItem('retakeQuestionIds', JSON.stringify(incorrectQuestionIds))
        setRetakeQuestionIds(incorrectQuestionIds)
        navigate(`/quiz/${quiz?.id}/questions`)
    }

    async function handleEvaluate(answers: QuizAnswers | null, timedOut = false) {
        navigate(`/quiz/${quiz?.id}/questions`)
        updateSessionStorage(answers)
        setQuizAnswers(answers)
        sessionStorage.removeItem('retakeQuestionIds')
        setRetakeQuestionIds(null)

        if (!quiz || !answers) return

        const evaluation = evaluate(quiz, answers)
        const score = Math.round((evaluation.score / evaluation.total) * 100)
        const points = evaluation.score
        const maxScore = evaluation.total
        const attemptId = getQuizRunId()

        const startTimeMs = sessionStorage.getItem('quizStartTime')
        const endTime = new Date()

        if (startTimeMs) {
            const durationSeconds = Math.round((endTime.getTime() - Number.parseInt(startTimeMs)) / 1000)

            await updateAttempt(attemptId, {
                quizId: quiz.id,
                durationSeconds,
                points,
                score,
                status: timedOut ? AttemptStatus.TIMEOUT : AttemptStatus.FINISHED,
                maxScore,
                startedAt: new Date(Number.parseInt(startTimeMs)).toISOString(),
                finishedAt: endTime.toISOString(),
            })

            sessionStorage.removeItem('quizStartTime')
        }
    }

    const activeQuiz = useMemo(() => {
        if (!quiz) return undefined
        if (!retakeQuestionIds) return quiz
        return {
            ...quiz,
            questions: quiz.questions.filter(q => retakeQuestionIds.includes(q.id)),
        }
    }, [quiz, retakeQuestionIds])

    if (activeQuiz) {
        return quizAnswers ? (
            <QuizScorePage quiz={activeQuiz} quizAnswers={quizAnswers} onRetakeIncorrect={handleRetakeIncorrect} />
        ) : (
            <QuestionForm quiz={activeQuiz} onEvaluate={handleEvaluate} />
        )
    }
}
