import './question-form.scss'

import { isNumericalQuestion, type AnswerIdxs, type Question } from '#model/question.ts'
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

                {!state.submitted && (
                    <input type="submit" value="Submit" className="submit-btn" disabled={!state.hasAnswer} />
                )}
                {state.showResultFeedback && (
                    <>
                        <QuestionCorrectness score={state.score} />
                        <QuestionScore score={state.score} />
                        <QuestionExplanation text={questionExplanation} />
                    </>
                )}
            </fieldset>
        </Form>
    )
}
