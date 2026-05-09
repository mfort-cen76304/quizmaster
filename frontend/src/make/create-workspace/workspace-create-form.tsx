import { useState } from 'react'

import type { WorkspaceRequest } from '#fe/api/workspace.ts'
import { Field, SubmitButton, TextInput, Form, Row, Button } from '#fe/shared'

interface WorkspaceCreateProps {
    readonly onSubmit: (data: WorkspaceRequest) => void
    readonly onBack: () => void
}

export const WorkspaceCreateForm = ({ onSubmit, onBack }: WorkspaceCreateProps) => {
    const [title, setTitle] = useState<string>('')

    return (
        <Form onSubmit={() => onSubmit({ title })}>
            <Field label="Workspace Title">
                <TextInput id="workspace-title" value={title} onChange={setTitle} />
            </Field>
            <Row>
                <Button id="back" className="primary button" onClick={onBack}>
                    Back
                </Button>
                <SubmitButton />
            </Row>
        </Form>
    )
}
