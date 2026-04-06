import './question-take-page.scss'
import { useState } from 'react'
import { useParams } from 'react-router'

import { useApi } from '#api/hooks.ts'
import { fetchQuestion } from '#api/question.ts'
import type { Question } from '#model/question.ts'
import { QuestionForm } from '#pages/take/question-take'

export const QuestionTakePage = () => {
    const params = useParams()

    const [question, setQuestion] = useState<Question | null>(null)

    useApi(params.id, fetchQuestion, setQuestion)

    return question ? <QuestionForm question={question} showAnswerCount={question.isEasy} /> : null
}
