import { useState } from 'react'
import { useParams } from 'react-router'

import { useApi } from '#fe/api/hooks.ts'
import { fetchQuizAttempt } from '#fe/api/quiz.ts'
import type { QuizTake } from '#fe/model/quiz.ts'

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
