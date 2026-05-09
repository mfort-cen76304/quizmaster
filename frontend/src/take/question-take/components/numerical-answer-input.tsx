import React from 'react'

interface NumericalAnswerInputProps {
    readonly value: string
    readonly onChange: (value: string) => void
}

export const NumericalAnswerInput = ({ value, onChange }: NumericalAnswerInputProps) => {
    const focusRef = React.useCallback((input: HTMLInputElement | null) => input?.focus(), [])

    return (
        <div className="answers">
            <input
                type="number"
                id="numerical-answer"
                step="any"
                ref={focusRef}
                value={value}
                onChange={e => onChange(e.target.value)}
            />
        </div>
    )
}
