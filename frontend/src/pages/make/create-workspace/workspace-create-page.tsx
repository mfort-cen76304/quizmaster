import { useState } from 'react'
import { useNavigate } from 'react-router'

import { postWorkspace, type WorkspaceRequest } from '#api/workspace.ts'
import { tryCatch } from '#fe/helpers.ts'
import { urls } from '#fe/urls.ts'
import { Alert, Page } from '#pages/components'

import { WorkspaceCreateForm } from './workspace-create-form.tsx'

export function WorkspaceCreatePage() {
    const [errorMessage, setErrorMessage] = useState<string>('')

    const navigate = useNavigate()

    const onSubmit = async (data: WorkspaceRequest) =>
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
