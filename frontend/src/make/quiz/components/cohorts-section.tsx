import { useState } from 'react'

import { Alert, Field, TextInput } from '#fe/shared'

import { errorMessage } from '../validations.ts'

type CohortError = 'cohort-name-too-long' | 'duplicate-cohort-name'

const MAX_COHORT_NAME_LENGTH = 30

interface CohortsSectionProps {
    readonly cohortNames: readonly string[]
    readonly onAdd: (name: string) => void
    readonly onRemove: (index: number) => void
}

export const CohortsSection = ({ cohortNames, onAdd, onRemove }: CohortsSectionProps) => {
    const [draft, setDraft] = useState('')
    const [error, setError] = useState<CohortError | null>(null)

    const handleAdd = () => {
        const name = draft.trim()
        if (name.length === 0) return
        if (name.length > MAX_COHORT_NAME_LENGTH) {
            setError('cohort-name-too-long')
            return
        }
        if (cohortNames.includes(name)) {
            setError('duplicate-cohort-name')
            return
        }
        onAdd(name)
        setDraft('')
        setError(null)
    }

    return (
        <Field label="Cohorts">
            <div className="cohort-list">
                {cohortNames.map((name, index) => (
                    <span key={name} className="cohort-item">
                        {name}
                        <button type="button" aria-label={`Remove cohort ${name}`} onClick={() => onRemove(index)}>
                            ×
                        </button>
                    </span>
                ))}
            </div>
            <TextInput id="cohort-input" value={draft} onChange={setDraft} />
            <button id="add-cohort-button" type="button" onClick={handleAdd}>
                Add cohort
            </button>
            {error && (
                <Alert type="error" dataTestId={error}>
                    {errorMessage[error]}
                </Alert>
            )}
        </Field>
    )
}
