import type { QuestionType } from '#shared/types/enums.ts'

import { RadioSet } from './radio-set.tsx'

const OPTIONS: Record<QuestionType, string> = {
    single: 'Single choice',
    multiple: 'Multiple choice',
    numerical: 'Numerical',
}

interface QuestionTypeRadioSetProps {
    readonly name: string
    readonly value: QuestionType
    readonly onChange: (value: QuestionType) => void
}

export const QuestionTypeRadioSet = ({ name, value, onChange }: QuestionTypeRadioSetProps) => (
    <RadioSet name={name} value={value} onChange={onChange} options={OPTIONS} />
)
