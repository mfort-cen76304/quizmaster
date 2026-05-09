import './create-question.scss'
import { useNavigate } from 'react-router'

import { type QuestionRequest, saveQuestion } from '#fe/api/question.ts'
import { Page } from '#fe/pages/components/page.tsx'
import { urls, useWorkspaceId } from '#fe/urls.ts'

import { QuestionEditForm } from './form/question-form.tsx'

export function CreateQuestionPage() {
    const workspaceId = useWorkspaceId()
    const navigate = useNavigate()

    const handleSubmit = (questionData: QuestionRequest) => {
        saveQuestion(workspaceId, questionData).then(() => {
            navigate(urls.workspace(workspaceId))
        })
    }

    return (
        <Page
            title="Create Question"
            back={{ to: urls.workspace(workspaceId), label: 'Back to workspace' }}
            subtitle="Draft a clean quiz question, refine the answers, and use AI as a starting point when it helps."
            id="create-question-page"
        >
            <QuestionEditForm workspaceId={workspaceId} onSubmit={handleSubmit} />
        </Page>
    )
}
