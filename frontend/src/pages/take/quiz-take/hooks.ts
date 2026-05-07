import { useState } from 'react'
import { useParams } from 'react-router'

import { useApi } from '#api/hooks.ts'
import { fetchQuiz, fetchQuizAttempt, fetchWorkspaceQuiz } from '#api/quiz.ts'
import type { Quiz, QuizMetadata, QuizTake } from '#model/quiz.ts'

export const useQuizApi = () => {
    const params = useParams()
    const quizId = params.id

    const [quiz, setQuiz] = useState<QuizMetadata>()
    useApi(quizId, fetchQuiz, setQuiz)

    return quiz
}

export const useQuizAttemptApi = (quizRunId: number | null) => {
    const params = useParams()
    const quizId = params.id

    const [quiz, setQuiz] = useState<QuizTake>()
    useApi(
        quizId && quizRunId !== null ? `${quizId}:${quizRunId}` : undefined,
        () => fetchQuizAttempt(Number(quizId), quizRunId!),
        setQuiz,
    )

    return quiz
}

export const useWorkspaceQuizApi = (workspaceId: string) => {
    const params = useParams()
    const quizId = params.id

    const [quiz, setQuiz] = useState<Quiz>()
    useApi(quizId, id => fetchWorkspaceQuiz(workspaceId, id), setQuiz)

    return quiz
}
