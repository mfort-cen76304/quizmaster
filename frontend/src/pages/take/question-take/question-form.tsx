import './question-form.scss'
import React from 'react'

import { isNumericalQuestion, type AnswerIdxs, type Question, compareAnswers, calculateScore } from '#model/question.ts'
import { Form } from '#pages/components'
import { useQuestionTakeState, QuestionCorrectness, QuestionExplanation } from '#pages/take/question-take'

import { ChoiceAnswerList } from './components/choice-answer-list.tsx'
import { NumericalAnswerInput } from './components/numerical-answer-input.tsx'
import { QuestionScore } from './components/question-score.tsx'
import { stripTag } from './question-display.ts'
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
    const { onSubmitted, onAnswerSelected, showFeedbackOnSubmit = true, showAnswerCount = false } = props
    const isNumerical = isNumericalQuestion(props.question)

    const state = useQuestionTakeState(props)
    const score = calculateScore(compareAnswers(state.selectedAnswerIdxs, correctAnswers))
    const showFeedback = (idx: number) => state.isMultipleChoice || state.selectedAnswerIdxs[0] === idx

    const submitAndNotify = React.useCallback(
        (overrideAnswers?: AnswerIdxs) => {
            state.submit()
            onSubmitted?.(overrideAnswers ?? state.selectedAnswerIdxs)
        },
        [state, onSubmitted],
    )

    React.useEffect(() => {
        onAnswerSelected?.(state.selectedAnswerIdxs)
    }, [state.selectedAnswerIdxs, onAnswerSelected])

    useQuestionKeyboardShortcuts({
        enabled: !isNumerical,
        onDigitPressed: idx => {
            if (idx >= 0 && idx < answers.length) {
                state.onSelectedAnswerChange(idx, true)
                if (!state.isMultipleChoice) submitAndNotify([idx])
            }
        },
        onEnterPressed: () => {
            if (state.hasAnswer) submitAndNotify()
        },
    })

    const handleSubmit = () => {
        if (state.hasAnswer) submitAndNotify()
    }

    const isAnswerChecked = state.hasAnswer

    const showCorrectAnswersCount = showAnswerCount && state.isMultipleChoice

    return (
        <Form onSubmit={handleSubmit} id="question-form">
            <fieldset className="question-fieldset" name={`question-${props.question.id}`}>
                <legend>
                    <h1 id="question">{stripTag(props.question.question)}</h1>
                </legend>

                {showCorrectAnswersCount && (
                    <div>
                        Correct answers count is{' '}
                        <strong className="correct-answers-count">{correctAnswers.length}</strong>
                    </div>
                )}

                {!!props.question.imageUrl && (
                    <img src={props.question.imageUrl} alt="question" className="question-image" />
                )}

                {isNumerical ? (
                    <NumericalAnswerInput value={state.numericalAnswer} onChange={state.onNumericalAnswerChange} />
                ) : (
                    <ChoiceAnswerList
                        question={props.question}
                        showFeedback={idx => state.submitted && showFeedback(idx) && showFeedbackOnSubmit}
                        onSelectedAnswerChange={state.onSelectedAnswerChange}
                        isAnswerChecked={state.isAnswerChecked}
                    />
                )}

                {!state.submitted && (
                    <input type="submit" value="Submit" className="submit-btn" disabled={!isAnswerChecked} />
                )}
                {state.submitted && showFeedbackOnSubmit && (
                    <>
                        <QuestionCorrectness score={score} />
                        <QuestionScore score={score} />
                        <QuestionExplanation text={questionExplanation} />
                    </>
                )}
            </fieldset>
        </Form>
    )
}
