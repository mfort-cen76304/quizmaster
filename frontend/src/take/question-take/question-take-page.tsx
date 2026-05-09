import { useState } from 'react'
import { useParams } from 'react-router'

import type { QuestionTake } from '#fe/model/question.ts'
import { useApi } from '#fe/shared/api/hooks.ts'
import { fetchQuestion, submitQuestionAnswer } from '#fe/take/api/question.ts'

import { QuestionForm } from './question-form.tsx'
import { QuizQuestionProvider } from './quiz-question-context.tsx'

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
