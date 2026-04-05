import './question-form.scss'
import React from 'react'

import { isNumericalQuestion, type AnswerIdxs, type Question, compareAnswers, calculateScore } from '#model/question.ts'
import type { QuizMode, Difficulty } from '#model/quiz.ts'
import { Form } from '#pages/components'
import { Answer, useQuestionTakeState, QuestionCorrectness, QuestionExplanation } from '#pages/take/question-take'

import { QuestionScore } from './components/question-score.tsx'

export interface QuestionFormProps {
    readonly question: Question
    readonly selectedAnswerIdxs?: AnswerIdxs
    readonly onSubmitted?: (selectedAnswerIdxs: AnswerIdxs) => void
    readonly onAnswerSelected?: (selectedAnswerIdxs: AnswerIdxs) => void
    readonly mode: QuizMode
    readonly quizDifficulty?: Difficulty
}

export const QuestionForm = (props: QuestionFormProps) => {
    const { correctAnswers, isEasy, answers, questionExplanation } = props.question
    const isNumerical = isNumericalQuestion(props.question)
    const numericalInputRef = React.useRef<HTMLInputElement>(null)

    const state = useQuestionTakeState(props)
    const score = calculateScore(compareAnswers(state.selectedAnswerIdxs, correctAnswers))
    const showFeedback = (idx: number) => state.isMultipleChoice || state.selectedAnswerIdxs[0] === idx

    // Notify parent when answers change
    React.useEffect(() => {
        props.onAnswerSelected?.(state.selectedAnswerIdxs)
    }, [state.selectedAnswerIdxs, props])

    React.useEffect(() => {
        if (isNumerical) return
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Enter') {
                if (state.selectedAnswerIdxs.length > 0) {
                    state.submit()
                    props.onSubmitted?.(state.selectedAnswerIdxs)
                }
                return
            }

            const isNumpadDigit = /^Numpad[0-9]$/.test(e.code)
            const isTopRowDigit = /^Digit[0-9]$/.test(e.code)

            if (!isNumpadDigit && !isTopRowDigit) return

            const idx = Number(e.code.slice(-1)) - 1
            if (idx < 0 || idx >= answers.length) return

            state.onSelectedAnswerChange(idx, true)
            if (!state.isMultipleChoice) {
                state.submit()
                props.onSubmitted?.([idx])
            }
        }

        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
    }, [answers.length, isNumerical, state, props])

    React.useEffect(() => {
        if (!isNumerical) return
        const focusInput = () => numericalInputRef.current?.focus()
        focusInput()
        const timeoutId = window.setTimeout(focusInput, 0)
        const frameId = window.requestAnimationFrame(focusInput)
        const intervalId = window.setInterval(() => {
            const input = numericalInputRef.current
            if (!input) return
            input.focus()
        }, 50)
        const stopIntervalTimeoutId = window.setTimeout(() => window.clearInterval(intervalId), 10000)

        return () => {
            window.clearTimeout(timeoutId)
            window.cancelAnimationFrame(frameId)
            window.clearInterval(intervalId)
            window.clearTimeout(stopIntervalTimeoutId)
        }
    }, [isNumerical])

    const handleSubmit = () => {
        if (state.hasAnswer) {
            state.submit()
            props.onSubmitted?.(state.selectedAnswerIdxs)
        }
    }

    const isAnswerChecked = state.hasAnswer

    const correctAnswersCount = correctAnswers.length

    const showCorrectAnswersCount =
        state.isMultipleChoice &&
        (props.quizDifficulty
            ? props.quizDifficulty === 'easy'
                ? true
                : props.quizDifficulty === 'hard'
                  ? false
                  : isEasy
            : isEasy)

    return (
        <Form onSubmit={handleSubmit} id="question-form">
            <fieldset className="question-fieldset" name={`question-${props.question.id}`}>
                <legend>
                    <h1 id="question">{props.question.question.replace(/^\[[^\]]+\]\s*/, '')}</h1>
                </legend>

                {showCorrectAnswersCount && (
                    <div>
                        Correct answers count is{' '}
                        <strong className="correct-answers-count">{correctAnswersCount}</strong>
                    </div>
                )}

                {!!props.question.imageUrl && (
                    <img src={props.question.imageUrl} alt="question" className="question-image" />
                )}

                {isNumerical ? (
                    <div className="answers">
                        <input
                            type="number"
                            id="numerical-answer"
                            step="any"
                            ref={numericalInputRef}
                            value={state.numericalAnswer}
                            onChange={e => state.onNumericalAnswerChange(e.target.value)}
                        />
                    </div>
                ) : (
                    <ul className="answers">
                        {answers.map((answer, idx) => (
                            <Answer
                                key={answer}
                                isMultipleChoice={state.isMultipleChoice}
                                idx={idx}
                                questionId={props.question.id}
                                answer={answer}
                                isCorrect={correctAnswers.includes(idx)}
                                explanation={
                                    props.question.explanations ? props.question.explanations[idx] : 'not defined'
                                }
                                showFeedback={state.submitted && showFeedback(idx) && props.mode === 'learn'}
                                onAnswerChange={state.onSelectedAnswerChange}
                                isAnswerChecked={state.isAnswerChecked}
                            />
                        ))}
                    </ul>
                )}

                {!state.submitted && (
                    <input type="submit" value="Submit" className="submit-btn" disabled={!isAnswerChecked} />
                )}
                {state.submitted && props.mode === 'learn' && (
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
