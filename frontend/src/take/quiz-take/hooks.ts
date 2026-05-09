import { useState } from 'react'
import { useParams } from 'react-router'

import type { QuizTake } from '#fe/model/quiz.ts'
import { useApi } from '#fe/shared/api/hooks.ts'
import { fetchQuizAttempt } from '#fe/take/api/quiz.ts'

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
