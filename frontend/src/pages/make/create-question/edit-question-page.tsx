import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'

import { useApi } from '#api/hooks.ts'
import { fetchWorkspaceQuestion, type QuestionApiData, updateQuestion } from '#api/question.ts'
import { urls, useWorkspaceId } from '#fe/urls.ts'
import type { Question } from '#model/question.ts'
import { Page } from '#pages/components/page.tsx'

import { QuestionEditForm } from './form/question-form.tsx'

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

    const handleBack = () => {
        navigate(urls.workspace(workspaceId))
    }

    return (
        <Page
            title="Edit Question"
            eyebrow="Workspace authoring"
            subtitle="Tune the prompt, answers, and explanations until the question reads clearly and scores fairly."
            id="edit-question-page"
        >
            {question && <QuestionEditForm question={question} onSubmit={handleSubmit} onBack={handleBack} />}
        </Page>
    )
}
