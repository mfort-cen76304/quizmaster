import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useApi } from '#fe/api/hooks'
import { fetchWorkspaceQuestion, type QuestionApiData, updateQuestion } from '#fe/api/question.ts'

import { Page } from '#fe/pages/components/page.tsx'
import { QuestionEditForm } from './form/question-form.tsx'
import type { Question } from '#fe/model/question.ts'
import { urls, useWorkspaceId } from '#fe/urls.ts'

export function EditQuestionPage() {
    const workspaceId = useWorkspaceId()
    const params = useParams()
    const questionId = params.id || ''

    const [question, setQuestion] = useState<Question | undefined>(undefined)

    useApi(questionId, id => fetchWorkspaceQuestion(workspaceId, id), setQuestion)
    const navigate = useNavigate()

    const handleSubmit = (questionData: QuestionApiData) => {
        updateQuestion(workspaceId, question?.id ?? 0, questionData).then(() => {
            navigate(urls.workspace(workspaceId))
        })
    }

    return (
        <Page title="Edit Question" id="edit-question-page">
            {question && <QuestionEditForm question={question} onSubmit={handleSubmit} />}
        </Page>
    )
}
