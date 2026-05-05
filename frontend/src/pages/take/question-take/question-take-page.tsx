import { useState } from 'react'
import { useParams } from 'react-router'

import { useApi } from '#api/hooks.ts'
import { fetchQuestion, submitQuestionAnswer } from '#api/question.ts'
import type { QuestionTake } from '#model/question.ts'
import { QuestionForm, QuizQuestionProvider } from '#pages/take/question-take'

export const QuestionTakePage = () => {
    const params = useParams()

    const [question, setQuestion] = useState<QuestionTake | null>(null)

    useApi(params.id, fetchQuestion, setQuestion)

    return question ? (
        <QuizQuestionProvider
            value={{
                selectedAnswerIdxs: [],
                onSubmitted: answer => submitQuestionAnswer(String(question.id), answer),
                onAnswerSelected: () => {},
                showFeedbackOnSubmit: true,
                difficulty: 'keep-question',
            }}
        >
            <QuestionForm question={question} />
        </QuizQuestionProvider>
    ) : null
}
