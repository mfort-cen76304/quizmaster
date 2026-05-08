import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router'

import { evaluateQuiz } from '#api/stats.ts'
import { urls, useWorkspaceId } from '#fe/urls.ts'
import type { QuizEvaluationResponse, QuizTake } from '#model/quiz.ts'

import { DryRunIndicator } from './dry-run-indicator.tsx'
import { useQuizAttemptApi } from './hooks.ts'
import type { QuizAnswers } from './quiz-answers-state.ts'
import { QuizPlayForm } from './quiz-play.tsx'
import { QuizScorePage } from './quiz-score-page.tsx'
import { clearQuizTakeSession, getStoredQuizRunId, loadQuizAnswers, storeQuizAnswers } from './quiz-session.ts'

export const QuizDryRunTakePage = () => {
    const params = useParams()
    const location = useLocation()
    const navigate = useNavigate()
    const workspaceId = useWorkspaceId()
    const quizId = params.id ? Number(params.id) : null
    const [initialStateQuiz] = useState<QuizTake | undefined>(
        () => (location.state as { quiz?: QuizTake } | null)?.quiz,
    )
    const quizRunId = quizId !== null ? getStoredQuizRunId(quizId) : null
    const fetchedQuiz = useQuizAttemptApi(initialStateQuiz ? null : quizRunId)
    const quiz = initialStateQuiz ?? fetchedQuiz
    const [quizAnswers, setQuizAnswers] = useState<QuizAnswers | null>(() => loadQuizAnswers())
    const [scoredQuiz, setScoredQuiz] = useState<QuizEvaluationResponse | null>(null)
    const canTakeQuiz = quiz !== undefined && quizRunId !== null

    useEffect(() => {
        if (quizId === null) return
        if (canTakeQuiz) return
        if (quizRunId !== null && quiz === undefined) return

        clearQuizTakeSession(quizId)
        navigate(urls.workspaceQuizDryRun(workspaceId, quizId), { replace: true })
    }, [quizId, canTakeQuiz, navigate, quiz, quizRunId, workspaceId])

    async function handleEvaluate(answers: QuizAnswers | null) {
        if (!quiz) return

        navigate(urls.workspaceQuizDryRunTake(workspaceId, quiz.id))
        storeQuizAnswers(answers)
        setQuizAnswers(answers)

        if (!answers || quizRunId === null) return

        const response = await evaluateQuiz(quiz.id, quizRunId, {
            questionIds: quiz.questions.map(question => question.id),
            answers: quiz.questions.flatMap((question, index) => {
                const answer = answers.finalAnswers[index]
                return answer ? [{ ...answer, questionId: question.id }] : []
            }),
        })
        setScoredQuiz(response)
    }

    if (quiz && quizRunId !== null) {
        return (
            <>
                <DryRunIndicator />
                {quizAnswers && scoredQuiz ? (
                    <QuizScorePage quiz={quiz} quizAnswers={quizAnswers} result={scoredQuiz} />
                ) : (
                    <QuizPlayForm
                        quiz={quiz}
                        quizRunId={quizRunId}
                        questionsBaseUrl={urls.workspaceQuizDryRunTake(workspaceId, quiz.id)}
                        onEvaluate={handleEvaluate}
                    />
                )}
            </>
        )
    }
}
