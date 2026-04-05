import { useState } from 'react'
import { useNavigate } from 'react-router'

import { tryCatch } from '#fe/helpers.ts'
import { postWorkspace } from '#fe/api/workspace.ts'
import { urls } from '#fe/urls.ts'

import { Alert, Page } from '#fe/pages/components'
import { WorkspaceCreateForm, type WorkspaceFormData } from './workspace-create-form.tsx'

export function WorkspaceCreatePage() {
    const [errorMessage, setErrorMessage] = useState<string>('')

    const navigate = useNavigate()

    const onSubmit = async (data: WorkspaceFormData) =>
        await tryCatch(setErrorMessage, async () => {
            const response = await postWorkspace(data)
            navigate(urls.workspace(response.guid))
        })

    const onBack = () => {
        navigate(urls.home())
    }

    return (
        <Page title="Create Workspace" id="create-workspace-page">
            <WorkspaceCreateForm onSubmit={onSubmit} onBack={onBack} />
            {errorMessage && <Alert type="error">{errorMessage}</Alert>}
        </Page>
    )
}
