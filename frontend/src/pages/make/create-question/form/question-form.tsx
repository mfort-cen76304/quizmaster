import type { QuestionRequest } from '#api/question.ts'
import type { Question } from '#model/question.ts'
import { SubmitButton, Form, Field, TextArea, TextInput, CheckField, Row, Button, RadioSet } from '#pages/components'
import { ErrorMessage, createValidator } from '#pages/components/forms/validations.tsx'
import { AnswersEdit, NumericalAnswerEdit, stateToQuestionApiData } from '#pages/make/create-question/form'
import { RobinAiHelper, useRobinAi } from '#pages/make/create-question/robin-ai'

import { useQuestionFormState } from './question-form-state.ts'
import { validateQuestionFormState, errorMessage } from './validators.ts'

interface QuestionEditProps {
    readonly question?: Question
    readonly onSubmit: (questionData: QuestionRequest) => void
    readonly onBack?: () => void
}

export const QuestionEditForm = ({ question, onSubmit, onBack }: QuestionEditProps) => {
    const state = useQuestionFormState(question)
    const robin = useRobinAi(state)

    const validator = createValidator(() => validateQuestionFormState(state), errorMessage)

    const handleSubmit = () => onSubmit(stateToQuestionApiData(state))

    return (
        <>
            <RobinAiHelper
                open={robin.sheetOpen}
                onOpen={robin.open}
                onClose={robin.close}
                promptText={robin.promptText}
                onPromptTextChange={robin.setPromptText}
                onGenerate={() => void robin.generate()}
                loading={robin.loading}
                error={robin.error}
                hasPreviousVersion={robin.hasPreviousVersion}
                onRestorePreviousVersion={robin.restorePreviousVersion}
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
