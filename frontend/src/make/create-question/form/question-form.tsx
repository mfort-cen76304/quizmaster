import type { QuestionRequest } from '#fe/make/api/question.ts'
import { AnswersEdit, NumericalAnswerEdit, stateToQuestionApiData } from '#fe/make/create-question/form'
import { RobinAiHelper } from '#fe/make/create-question/robin-ai'
import { SubmitButton, Form, Field, TextArea, TextInput, CheckField, Row, QuestionTypeRadioSet } from '#fe/shared'
import { ErrorMessage, createValidator } from '#fe/shared/forms/validations.tsx'
import type { Question } from '#fe/shared/model/question.ts'

import { useQuestionFormState } from './question-form-state.ts'
import { validateQuestionFormState, errorMessage } from './validators.ts'

interface QuestionEditProps {
    readonly workspaceId: string
    readonly question?: Question
    readonly onSubmit: (questionData: QuestionRequest) => void
}

export const QuestionEditForm = ({ workspaceId, question, onSubmit }: QuestionEditProps) => {
    const state = useQuestionFormState(question)

    const validator = createValidator(() => validateQuestionFormState(state), errorMessage)

    const handleSubmit = () => onSubmit(stateToQuestionApiData(state))

    return (
        <>
            <RobinAiHelper
                workspaceId={workspaceId}
                form={{ snapshot: state.snapshot, applyPatch: state.applyPatch }}
                currentQuestion={question ? () => stateToQuestionApiData(state) : undefined}
                currentQuestionId={question?.id}
            />
            <Form id="question-create-form" validator={validator} onSubmit={handleSubmit}>
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
                <Row>
                    <Field label="Question type" required>
                        <QuestionTypeRadioSet
                            name="question-type"
                            value={state.questionType}
                            onChange={state.selectQuestionType}
                        />
                    </Field>
                    {state.isMultipleChoice && (
                        <CheckField id="is-easy" label="Easy" checked={state.isEasy} onToggle={state.setIsEasy} />
                    )}
                </Row>
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
                <SubmitButton />
            </Form>
        </>
    )
}
