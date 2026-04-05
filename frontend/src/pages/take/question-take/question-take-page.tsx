import './question-take-page.scss'

import { useState } from 'react'
import { useParams } from 'react-router'

import type { Question } from '#fe/model/question.ts'
import { useApi } from '#fe/api/hooks'
import { fetchQuestion } from '#fe/api/question.ts'
import { QuestionForm } from '#fe/pages/take/question-take'

export const QuestionTakePage = () => {
    const params = useParams()

    const [question, setQuestion] = useState<Question | null>(null)

    useApi(params.id, fetchQuestion, setQuestion)

    return question ? <QuestionForm question={question} mode={'learn' as const} /> : null
}
