import { useState } from 'react'
import { Field, SubmitButton, TextInput, Form, Row, Button } from '#fe/pages/components'

export interface WorkspaceFormData {
    readonly title: string
}

interface WorkspaceCreateProps {
    readonly onSubmit: (data: WorkspaceFormData) => void
    readonly onBack: () => void
}

export const WorkspaceCreateForm = ({ onSubmit, onBack }: WorkspaceCreateProps) => {
    const [title, setTitle] = useState<string>('')

    const toFormData = (title: string): WorkspaceFormData => ({ title })

    return (
        <Form onSubmit={() => onSubmit(toFormData(title))}>
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
