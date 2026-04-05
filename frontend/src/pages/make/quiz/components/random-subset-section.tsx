import { CheckField, NumberInput } from '#fe/pages/components'
import { ErrorMessage } from '#fe/pages/components/forms/validations.tsx'

interface RandomSubsetSectionProps {
    readonly enabled: boolean
    readonly onEnabledChange: (value: boolean) => void
    readonly count: number
    readonly onCountChange: (value: number) => void
}

export const RandomSubsetSection = ({ enabled, onEnabledChange, count, onCountChange }: RandomSubsetSectionProps) => (
    <>
        <CheckField id="isRandomized" label="Serve a random subset" checked={enabled} onToggle={onEnabledChange} />
        {enabled && (
            <span className="inline-label">
                <div className="random-count-input">
                    <NumberInput id="quiz-randomQuestionCount" value={count} onChange={onCountChange} />
                </div>
                Questions per take
            </span>
        )}
        <ErrorMessage errorCode="too-many-randomized-questions" />
    </>
)
