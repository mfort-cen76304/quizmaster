import { Button, Field, TextInput, Row, CheckField } from '#pages/components'
import { ErrorMessage } from '#pages/components/forms/validations.tsx'
import TrashButton from '#pages/components/trash-button.tsx'

import type { AnswerState } from './question-form-state.ts'

interface AnswerRowProps {
    readonly state: AnswerState
    readonly isMultipleChoice: boolean
    readonly showExplanations: boolean
    onDelete: () => void
    deleteDisabled: boolean
}

export const AnswerRow = ({ state, isMultipleChoice, onDelete, deleteDisabled, showExplanations }: AnswerRowProps) => (
    <div className="answer-row">
        <input
            type={isMultipleChoice ? 'checkbox' : 'radio'}
            checked={state.isCorrect}
            onChange={state.toggleCorrect}
        />
        <div>
            <TextInput placeholder="answer" className="text" value={state.answer} onChange={state.setAnswer} />
            {showExplanations && (
                <TextInput
                    placeholder="explanation"
                    className="explanation"
                    value={state.explanation}
                    onChange={state.setExplanation}
                />
            )}
        </div>
        <TrashButton onClick={onDelete} disabled={deleteDisabled} />
    </div>
)

interface AnswersProps {
    readonly answerStates: readonly AnswerState[]
    readonly isMultipleChoice: boolean
    readonly addAnswer: () => void
    readonly generateExplanations: () => void | Promise<void>
    readonly generateExplanationsLoading: boolean
    readonly showExplanations: boolean
    readonly showGenerateExplanationsButton: boolean
    readonly setShowExplanations: (show: boolean | ((show: boolean) => boolean)) => void
    readonly removeAnswer: (idx: number) => void
}

export const AnswersEdit = ({
    answerStates,
    isMultipleChoice,
    addAnswer,
    generateExplanations,
    generateExplanationsLoading,
    showExplanations,
    showGenerateExplanationsButton,
    setShowExplanations,
    removeAnswer,
}: AnswersProps) => {
    const handleToggleExplanations = () => setShowExplanations(showExplanations => !showExplanations)

    return (
        <Field label="Enter your answers" required>
            <div className="answer-controls">
                <CheckField
                    id="show-explanation"
                    label="Show explanations"
                    onToggle={handleToggleExplanations}
                    checked={showExplanations}
                />
                {showGenerateExplanationsButton && (
                    <Button
                        id="generate-explanations"
                        className="secondary button"
                        onClick={generateExplanations}
                        disabled={generateExplanationsLoading}
                    >
                        {generateExplanationsLoading ? 'Generating...' : 'Generate Explanations'}
                    </Button>
                )}
            </div>
            {answerStates.map((state, idx) => (
                <AnswerRow
                    key={state.id}
                    state={state}
                    isMultipleChoice={isMultipleChoice}
                    onDelete={() => removeAnswer(idx)}
                    deleteDisabled={answerStates.length < 3}
                    showExplanations={showExplanations}
                />
            ))}
            <Row>
                <Button onClick={addAnswer} className="secondary button" id="add-answer">
                    Add Answer
                </Button>
            </Row>
            <ErrorMessage errorCode="no-correct-answer" />
            <ErrorMessage errorCode="empty-answer" />
            <ErrorMessage errorCode="empty-answer-explanation" />
            <ErrorMessage errorCode="few-correct-answers" />
        </Field>
    )
}
