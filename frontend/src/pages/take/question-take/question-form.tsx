import './question-form.scss'

import type { AnswerIdxs, Question } from '#model/question.ts'
import { Form } from '#pages/components'
import { useQuestionTakeState } from './question-take-state.ts'

import { AnswerCountHint } from './components/answer-count-hint.tsx'
import { ChoiceAnswerList } from './components/choice-answer-list.tsx'
import { NumericalAnswerInput } from './components/numerical-answer-input.tsx'
import { QuestionFeedback } from './components/question-feedback.tsx'
import { QuestionHeader } from './components/question-header.tsx'
import { QuestionImage } from './components/question-image.tsx'
import { SubmitButton } from './components/submit-button.tsx'
import { useQuestionKeyboardShortcuts } from './use-keyboard-shortcuts.ts'

export interface QuestionFormProps {
    readonly question: Question
    readonly selectedAnswerIdxs?: AnswerIdxs
    readonly onSubmitted?: (selectedAnswerIdxs: AnswerIdxs) => void
    readonly onAnswerSelected?: (selectedAnswerIdxs: AnswerIdxs) => void
    readonly showFeedbackOnSubmit?: boolean
    readonly showAnswerCount?: boolean
}

export const QuestionForm = (props: QuestionFormProps) => {
    const { correctAnswers, answers, questionExplanation } = props.question
    const { showAnswerCount = false } = props

    const state = useQuestionTakeState(props)

    useQuestionKeyboardShortcuts({
        enabled: !state.isNumerical,
        onDigitPressed: idx => {
            if (idx >= 0 && idx < answers.length) {
                if (!state.isMultipleChoice) state.selectAndSubmit(idx)
                else state.onSelectedAnswerChange(idx, true)
            }
        },
        onEnterPressed: state.attemptSubmit,
    })

    const showCorrectAnswersCount = showAnswerCount && state.isMultipleChoice

    return (
        <Form onSubmit={state.attemptSubmit} id="question-form">
            <div className="question-fieldset">
                <QuestionHeader text={props.question.question} />

                {showCorrectAnswersCount && <AnswerCountHint count={correctAnswers.length} />}
                {props.question.imageUrl && <QuestionImage url={props.question.imageUrl} />}

                {state.isNumerical ? (
                    <NumericalAnswerInput value={state.numericalAnswer} onChange={state.onNumericalAnswerChange} />
                ) : (
                    <ChoiceAnswerList
                        question={props.question}
                        showFeedback={state.showFeedback}
                        onSelectedAnswerChange={state.onSelectedAnswerChange}
                        isAnswerChecked={state.isAnswerChecked}
                    />
                )}

                {!state.submitted && <SubmitButton disabled={!state.hasAnswer} />}
                {state.showResultFeedback && <QuestionFeedback score={state.score} explanation={questionExplanation} />}
            </div>
        </Form>
    )
}
