import { useState } from 'react'
import { useParams } from 'react-router'

import { useApi } from '#fe/api/hooks'
import { fetchQuiz } from '#fe/api/quiz'
import type { Quiz } from '#fe/model/quiz.ts'

export const useQuizApi = () => {
    const params = useParams()
    const quizId = params.id

    const [quiz, setQuiz] = useState<Quiz>()
    useApi(quizId, fetchQuiz, setQuiz)

    return quiz
}
