import { countDecimalDigits } from '#model/question.ts'
import { DecimalInput, Field, NumberInput } from '#pages/components'
import { ErrorMessage } from '#pages/components/forms/validations.tsx'

interface NumericalAnswerEditProps {
    readonly answer: string
    readonly onAnswerChange: (value: string) => void
    readonly tolerance: number
    readonly onToleranceChange: (value: number) => void
}

export const NumericalAnswerEdit = ({
    answer,
    onAnswerChange,
    tolerance,
    onToleranceChange,
}: NumericalAnswerEditProps) => {
    const decimalDigits = countDecimalDigits(answer)

    return (
        <>
            <Field label="Correct numerical answer" required>
                <DecimalInput id="numerical-correct-answer" value={answer} onChange={onAnswerChange} />
                <ErrorMessage errorCode="empty-numerical-answer" />
                <ErrorMessage errorCode="invalid-numerical-answer" />
                {decimalDigits > 0 && <p>{decimalDigits} decimal digits will be required in the answer.</p>}
            </Field>
            <Field label="Tolerance">
                <NumberInput
                    id="numerical-tolerance"
                    min={0}
                    step="any"
                    value={tolerance}
                    onChange={onToleranceChange}
                />
            </Field>
        </>
    )
}
