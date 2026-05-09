import type React from 'react'

import { Explanation } from './explanation.tsx'
import './answer.scss'

export interface AnswerProps {
    readonly isMultipleChoice: boolean
    readonly idx: number
    readonly questionId: number
    readonly answer: string
    readonly explanation: string
    readonly isCorrect: boolean
    readonly showFeedback: boolean
    readonly onAnswerChange: (idx: number, selected: boolean) => void
    readonly isAnswerChecked: (idx: number) => boolean
    readonly disabled?: boolean
}

export const Answer = (props: AnswerProps) => {
    const { disabled = false } = props
    const answerId = `answer-row-${props.idx}`
    const checkType = props.isMultipleChoice ? 'checkbox' : 'radio'

    const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        props.onAnswerChange(props.idx, event.target.checked)
    }

    const isChecked = props.isAnswerChecked(props.idx)

    const className = props.isCorrect ? 'correctly-selected' : isChecked ? 'incorrect' : 'correctly-not-selected'

    const barLabel = props.showFeedback
        ? props.isCorrect
            ? 'Correct answer:'
            : isChecked
              ? 'Your answer:'
              : null
        : null
    const barLabelClass = props.isCorrect ? 'bar-label correct-label' : 'bar-label'
    const barNote = props.showFeedback && props.isCorrect && !isChecked ? '(missed)' : null

    return (
        <li key={props.idx} id={`answer-row-${props.idx}`}>
            <div className={`answer-input-row ${props.showFeedback ? className : ''}`}>
                <input
                    type={checkType}
                    name={`question-${props.questionId}`}
                    id={answerId}
                    value={props.answer}
                    onChange={onChange}
                    checked={isChecked}
                    disabled={disabled}
                />
                {barLabel && <span className={barLabelClass}>{barLabel}</span>}
                <label htmlFor={answerId} id={`answer-label-${props.idx}`}>
                    {props.answer}
                </label>
                {barNote && <span className="bar-note">{barNote}</span>}
            </div>
            {props.showFeedback && props.explanation && <Explanation text={props.explanation} />}
        </li>
    )
}
