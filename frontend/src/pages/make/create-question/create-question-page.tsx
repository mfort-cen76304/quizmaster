import './create-question.scss'
import { useNavigate } from 'react-router'
import { type QuestionApiData, saveQuestion } from '#fe/api/question.ts'

import { Page } from '#fe/pages/components/page.tsx'
import { QuestionEditForm } from './form/question-form.tsx'
import { urls, useWorkspaceId } from '#fe/urls.ts'

export function CreateQuestionPage() {
    const workspaceId = useWorkspaceId()
    const navigate = useNavigate()

    const handleSubmit = (questionData: QuestionApiData) => {
        saveQuestion(workspaceId, questionData).then(() => {
            navigate(urls.workspace(workspaceId))
        })
    }

    const handleBack = () => {
        navigate(urls.workspace(workspaceId))
    }

    return (
        <Page title="Create Question" id="create-question-page">
            <QuestionEditForm onSubmit={handleSubmit} onBack={handleBack} />
        </Page>
    )
}
