import { useState } from 'react'

import { postAiAssistant } from '#fe/api/ai-assistant.ts'
import {
    SubmitButton,
    Form,
    Field,
    TextArea,
    TextInput,
    CheckField,
    Row,
    Button,
    Alert,
    RadioSet,
} from '#fe/pages/components'
import { AnswersEdit, stateToQuestionApiData } from '#fe/pages/make/create-question/form'
import { useQuestionFormState } from './question-form-state'
import { validateQuestionFormState, errorMessage, isValidImageUrl } from './validators.ts'
import type { QuestionApiData } from '#fe/api/question.ts'
import type { Question } from '#fe/model/question.ts'
import { ErrorMessage, createValidator } from '#fe/pages/components/forms/validations.tsx'

interface QuestionEditProps {
    readonly question?: Question
    readonly onSubmit: (questionData: QuestionApiData) => void
    readonly onBack?: () => void
    readonly onAiAssistantClick?: (instructions: string) => void
}

export const QuestionEditForm = ({ question, onSubmit, onBack, onAiAssistantClick }: QuestionEditProps) => {
    const isEditing = question != null
    const state = useQuestionFormState(question)
    const [aiLoading, setAiLoading] = useState(false)
    const [aiError, setAiError] = useState('')
    const [aiGenerated, setAiGenerated] = useState(false)

    const validator = createValidator(() => validateQuestionFormState(state), errorMessage)
    const hasImagePreview = state.imageUrl.trim() !== '' && isValidImageUrl(state.imageUrl)
    const hasInvalidImageUrl = state.imageUrl.trim() !== '' && !isValidImageUrl(state.imageUrl)
    const hasImageUrlTooLong = state.imageUrl.trim().length > 2048

    const handleSubmit = () =>
        onSubmit({
            ...stateToQuestionApiData(state),
            aiGenerated,
            questionType: state.questionType,
        })

    const handleAiAssistantClick = async () => {
        setAiError('')
        setAiLoading(true)
        setAiGenerated(false)

        try {
            if (onAiAssistantClick) {
                onAiAssistantClick(state.aiPromptText)
                return
            }
            const response = await postAiAssistant(state.aiPromptText)
            state.applyAiResponse(response)
            setAiGenerated(true)
        } catch (error) {
            const message = error instanceof Error ? error.message : 'AI assistant request failed.'
            setAiError(message || 'AI assistant request failed.')
        } finally {
            setAiLoading(false)
        }
    }

    return (
        <Form id="question-create-form" validator={validator} onSubmit={handleSubmit}>
            {!isEditing && !state.isNumerical && (
                <Field label="AI Prompt">
                    <div className="question-input-with-action">
                        <TextArea
                            id="ai-prompt-text"
                            className="question-textarea-with-action"
                            placeholder="What do you want ask?"
                            value={state.aiPromptText}
                            onChange={state.setAiPromptText}
                        />
                        <Button
                            id="question-ai-assistant-button"
                            className="secondary button question-ai-assistant-button"
                            onClick={handleAiAssistantClick}
                            disabled={aiLoading}
                        >
                            {aiLoading ? 'Loading...' : 'Generate'}
                        </Button>
                    </div>
                    <span className="example">Example: "What is the capital of France? Generate 6 answers."</span>
                    {aiError && <Alert type="error">{aiError}</Alert>}
                </Field>
            )}
            <Field label="Tag">
                <TextInput id="question-tag" value={state.tagText} onChange={state.setTagText} />
            </Field>
            <Field label="Question" required>
                <div className="question-input-with-action">
                    <TextArea
                        id="question-text"
                        className="question-textarea-with-action"
                        value={state.questionText}
                        onChange={state.setQuestionText}
                    />
                </div>
                <ErrorMessage errorCode="empty-question" />
            </Field>
            <Row>
                <Field label="Question type" required>
                    <RadioSet
                        name="question-type"
                        value={state.questionType}
                        onChange={state.selectQuestionType}
                        options={{ single: 'Single choice', multiple: 'Multiple choice', numerical: 'Numerical' }}
                    />
                </Field>
                {state.isMultipleChoice && (
                    <CheckField id="is-easy" label="Easy" checked={state.isEasy} onToggle={state.setIsEasy} />
                )}
            </Row>
            <Field label="Image URL">
                <TextInput id="image-url" value={state.imageUrl} onChange={state.setImageUrl} />
                {hasImageUrlTooLong && (
                    <Alert type="error" dataTestId="image-url-too-long">
                        {errorMessage['image-url-too-long']}
                    </Alert>
                )}
                {hasInvalidImageUrl && !hasImageUrlTooLong && (
                    <Alert type="error" dataTestId="invalid-image-url">
                        {errorMessage['invalid-image-url']}
                    </Alert>
                )}
                {hasImagePreview && <img src={state.imageUrl} alt="preview" className="image-preview" />}
            </Field>
            {state.isNumerical ? (
                <>
                    <Field label="Correct numerical answer" required>
                        <input
                            type="text"
                            inputMode="decimal"
                            id="numerical-correct-answer"
                            value={state.numericalAnswer}
                            onChange={e => state.setNumericalAnswer(e.target.value)}
                        />
                        <ErrorMessage errorCode="empty-numerical-answer" />
                        <ErrorMessage errorCode="invalid-numerical-answer" />
                    </Field>
                    <Field label="Tolerance">
                        <input
                            type="number"
                            id="numerical-tolerance"
                            min="0"
                            step="any"
                            value={state.tolerance}
                            onChange={e => state.setTolerance(e.target.value)}
                        />
                    </Field>
                </>
            ) : (
                <AnswersEdit
                    setShowExplanations={state.setShowExplanations}
                    showExplanations={state.showExplanations}
                    answerStates={state.answerStates}
                    isMultipleChoice={state.isMultipleChoice}
                    addAnswer={state.addAnswer}
                    removeAnswer={state.removeAnswer}
                />
            )}
            <Field label="Question explanation">
                <TextArea
                    id="question-explanation"
                    value={state.questionExplanation}
                    onChange={state.setQuestionExplanation}
                />
            </Field>
            <Row>
                {onBack && (
                    <Button id="back" className="primary button" onClick={onBack}>
                        Back
                    </Button>
                )}
                <SubmitButton />
            </Row>
        </Form>
    )
}
