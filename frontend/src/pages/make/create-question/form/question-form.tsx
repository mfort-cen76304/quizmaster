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
import { AnswersEdit, NumericalAnswerEdit, stateToQuestionApiData } from '#pages/make/create-question/form'

import { useQuestionFormState } from './question-form-state.ts'
import { RobinAiHelper } from './robin-ai-helper.tsx'
import { validateQuestionFormState, errorMessage } from './validators.ts'

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
            'This should be suitable for a numerical quiz question asking for just one numeric value. Include exactly 1 correct numeric answer and at least 1 incorrect answer. Return a non-empty explanation for every answer and return non-empty questionExplanation when requested.',
    }

    const typeInstruction = typeInstructionByQuestionType[questionType]
    return typeInstruction ? `${trimmedPrompt}\n\n${typeInstruction}` : trimmedPrompt
}

export const QuestionEditForm = ({ question, onSubmit, onBack }: QuestionEditProps) => {
    const state = useQuestionFormState(question)
    const [aiLoading, setAiLoading] = useState(false)
    const [aiError, setAiError] = useState('')
    const [robinSheetOpen, setRobinSheetOpen] = useState(false)

    const validator = createValidator(() => validateQuestionFormState(state), errorMessage)

    const handleSubmit = () => onSubmit(stateToQuestionApiData(state))

    const handleAiAssistantClick = async () => {
        setAiError('')
        setAiLoading(true)

        try {
            const response = await postAiAssistant(buildAiPrompt(state.aiPromptText, state.questionType))
            state.applyAiResponse(response)
            setRobinSheetOpen(false)
        } catch (error) {
            const message = error instanceof Error ? error.message : 'AI assistant request failed.'
            setAiError(message || 'AI assistant request failed.')
        } finally {
            setAiLoading(false)
        }
    }

    return (
        <>
            <RobinAiHelper
                open={robinSheetOpen}
                onOpen={() => setRobinSheetOpen(true)}
                onClose={() => setRobinSheetOpen(false)}
                promptText={state.aiPromptText}
                onPromptTextChange={state.setAiPromptText}
                onGenerate={() => void handleAiAssistantClick()}
                loading={aiLoading}
                error={aiError}
            />
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
                <Field label="Question" required>
                    <TextArea id="question-text" value={state.questionText} onChange={state.setQuestionText} />
                    <ErrorMessage errorCode="empty-question" />
                    {state.hasPreviousVersion && (
                        <Button
                            id="previous-version-button"
                            className="secondary button"
                            onClick={state.restorePreviousVersion}
                        >
                            Previous version
                        </Button>
                    )}
                    {aiError && !robinSheetOpen && (
                        <Alert type="error" dataTestId="ai-assistant-error">
                            {aiError}
                        </Alert>
                    )}
                </Field>
                <Field label="Image URL">
                    <TextInput id="image-url" value={state.imageUrl} onChange={state.setImageUrl} />
                    {state.imageUrl.trim() !== '' && (
                        <img src={state.imageUrl} alt="preview" className="image-preview" />
                    )}
                </Field>
                {state.isNumerical ? (
                    <NumericalAnswerEdit
                        answer={state.numericalAnswer}
                        onAnswerChange={state.setNumericalAnswer}
                        tolerance={state.tolerance}
                        onToleranceChange={state.setTolerance}
                    />
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
                <Field label="Tag">
                    <TextInput id="question-tag" value={state.tagText} onChange={state.setTagText} />
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
        </>
    )
}
