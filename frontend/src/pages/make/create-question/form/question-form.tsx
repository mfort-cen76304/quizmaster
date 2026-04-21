import { useState } from 'react'

import { postAiAssistant } from '#api/ai-assistant.ts'
import type { QuestionRequest } from '#api/question.ts'
import type { Question, QuestionType } from '#model/question.ts'
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
} from '#pages/components'
import { ErrorMessage, createValidator } from '#pages/components/forms/validations.tsx'
import { AnswersEdit, stateToQuestionApiData } from '#pages/make/create-question/form'

import { useQuestionFormState } from './question-form-state.ts'
import { validateQuestionFormState, errorMessage, isValidImageUrl } from './validators.ts'

interface QuestionEditProps {
    readonly question?: Question
    readonly onSubmit: (questionData: QuestionRequest) => void
    readonly onBack?: () => void
}

const buildAiPrompt = (prompt: string, questionType: QuestionType) => {
    const trimmedPrompt = prompt.trim()
    const typeInstructionByQuestionType: Record<QuestionType, string> = {
        single: 'This must be a single choice question with exactly 1 correct answer. Return a non-empty explanation for every answer.',
        multiple:
            'This must be a multiple choice question with at least 2 correct answers. Never return exactly 1 correct answer. Return a non-empty explanation for every answer.',
        numerical:
            'This should be suitable for a numerical quiz question asking for just one numeric value. Include exactly 1 correct numeric answer and at least 1 incorrect answer. Return a non-empty explanation for every answer.',
    }

    const typeInstruction = typeInstructionByQuestionType[questionType]
    return typeInstruction ? `${trimmedPrompt}\n\n${typeInstruction}` : trimmedPrompt
}

export const QuestionEditForm = ({ question, onSubmit, onBack }: QuestionEditProps) => {
    const isEditing = question != null
    const state = useQuestionFormState(question)
    const [aiLoading, setAiLoading] = useState(false)
    const [aiError, setAiError] = useState('')

    const validator = createValidator(() => validateQuestionFormState(state), errorMessage)
    const hasImagePreview = state.imageUrl.trim() !== '' && isValidImageUrl(state.imageUrl)
    const hasInvalidImageUrl = state.imageUrl.trim() !== '' && !isValidImageUrl(state.imageUrl)
    const hasImageUrlTooLong = state.imageUrl.trim().length > 2048

    const handleSubmit = () => onSubmit(stateToQuestionApiData(state))

    const handleAiAssistantClick = async () => {
        setAiError('')
        setAiLoading(true)

        try {
            const response = await postAiAssistant(buildAiPrompt(state.aiPromptText, state.questionType))
            state.applyAiResponse(response)
        } catch (error) {
            const message = error instanceof Error ? error.message : 'AI assistant request failed.'
            setAiError(message || 'AI assistant request failed.')
        } finally {
            setAiLoading(false)
        }
    }

    return (
        <Form id="question-create-form" validator={validator} onSubmit={handleSubmit}>
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
            {!isEditing && (
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
                        {(() => {
                            const dotIndex = state.numericalAnswer.indexOf('.')
                            if (dotIndex === -1) return null
                            const decimalDigits = state.numericalAnswer.length - dotIndex - 1
                            if (decimalDigits <= 0) return null
                            return <p>{decimalDigits} decimal digits will be required in the answer.</p>
                        })()}
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
                    showGenerateExplanationsButton={state.isAiGenerated}
                    generateExplanations={state.generateExplanations}
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
