import './question-form.scss'
import type { Question } from '#model/question.ts'
import { Form } from '#pages/components'

import { AnswerCountHint } from './components/answer-count-hint.tsx'
import { ChoiceAnswerList } from './components/choice-answer-list.tsx'
import { NumericalAnswerInput } from './components/numerical-answer-input.tsx'
import { QuestionFeedback } from './components/question-feedback.tsx'
import { QuestionHeader } from './components/question-header.tsx'
import { QuestionImage } from './components/question-image.tsx'
import { SubmitButton } from './components/submit-button.tsx'
import { useQuestionTakeState } from './question-take-state.ts'
import { useQuestionKeyboardShortcuts } from './use-keyboard-shortcuts.ts'

interface QuestionFormProps {
    readonly question: Question
}

export const QuestionForm = ({ question }: QuestionFormProps) => {
    const { correctAnswers, answers, questionExplanation } = question

    const state = useQuestionTakeState(question)

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

    return (
        <Form onSubmit={state.attemptSubmit} id="question-form">
            <div className="question-fieldset">
                <QuestionHeader text={question.question} />

                {state.showAnswerCount && <AnswerCountHint count={correctAnswers.length} />}
                {question.imageUrl && <QuestionImage url={question.imageUrl} />}

                {state.isNumerical ? (
                    <NumericalAnswerInput value={state.numericalAnswer} onChange={state.onNumericalAnswerChange} />
                ) : (
                    <ChoiceAnswerList
                        question={question}
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
