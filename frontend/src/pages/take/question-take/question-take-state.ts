import React from 'react'

import { isNumericalQuestion, type AnswerIdxs, compareAnswers, calculateScore } from '#model/question.ts'

import type { QuestionFormProps } from './question-form.tsx'

export interface QuestionTakeState {
    readonly isMultipleChoice: boolean
    readonly isNumerical: boolean
    readonly numericalAnswer: string
    readonly selectedAnswerIdxs: AnswerIdxs
    readonly submitted: boolean
    readonly hasAnswer: boolean
    readonly score: number
    readonly showResultFeedback: boolean
    readonly isAnswerChecked: (idx: number) => boolean
    readonly showFeedback: (idx: number) => boolean
    readonly onSelectedAnswerChange: (idx: number, selected: boolean) => void
    readonly onNumericalAnswerChange: (value: string) => void
    readonly selectAndSubmit: (idx: number) => void
    readonly submit: () => void
    readonly attemptSubmit: () => void
}

export const useQuestionTakeState = (props: QuestionFormProps): QuestionTakeState => {
    const { question, onSubmitted, onAnswerSelected, showFeedbackOnSubmit = true } = props
    const isNumerical = isNumericalQuestion(question)
    const isMultipleChoice = question.correctAnswers.length > 1
    const correctNumericalAnswer = question.answers[0] ?? ''

    const [selectedAnswerIdxs, setSelectedAnswerIdxs] = React.useState<AnswerIdxs>(props.selectedAnswerIdxs ?? [])
    const [numericalAnswer, setNumericalAnswer] = React.useState('')
    const [submitted, setSubmitted] = React.useState(false)

    const tolerance = question.tolerance ?? 0

    const score = calculateScore(compareAnswers(selectedAnswerIdxs, question.correctAnswers))

    const showFeedback = (idx: number) =>
        submitted && showFeedbackOnSubmit && (isMultipleChoice || selectedAnswerIdxs[0] === idx)

    const isAnswerChecked = (idx: number) => selectedAnswerIdxs.includes(idx)

    const hasAnswer = isNumerical ? numericalAnswer.trim() !== '' : selectedAnswerIdxs.length > 0
    const showResultFeedback = submitted && showFeedbackOnSubmit

    const submit = React.useCallback(() => {
        setSubmitted(true)
        onSubmitted?.(selectedAnswerIdxs)
    }, [selectedAnswerIdxs, onSubmitted])

    const selectAndSubmit = React.useCallback(
        (idx: number) => {
            setSelectedAnswerIdxs([idx])
            setSubmitted(true)
            onSubmitted?.([idx])
        },
        [onSubmitted],
    )

    const onSelectedAnswerChange = (idx: number, selected: boolean) => {
        if (isNumerical) return
        setSubmitted(false)
        if (!isMultipleChoice) setSelectedAnswerIdxs([idx])
        else if (selected) setSelectedAnswerIdxs(prev => [...prev, idx])
        else setSelectedAnswerIdxs(prev => prev.filter(i => i !== idx))
    }

    React.useEffect(() => {
        onAnswerSelected?.(selectedAnswerIdxs)
    }, [selectedAnswerIdxs, onAnswerSelected])

    const onNumericalAnswerChange = (value: string) => {
        setSubmitted(false)
        setNumericalAnswer(value)

        const normalizedValue = value.trim()
        if (normalizedValue === '') {
            setSelectedAnswerIdxs([])
            return
        }

        const userAnswer = Number.parseFloat(normalizedValue)
        const correctAnswer = Number.parseFloat(correctNumericalAnswer)

        if (Math.abs(userAnswer - correctAnswer) <= tolerance) {
            setSelectedAnswerIdxs([0])
            return
        }

        setSelectedAnswerIdxs([1])
    }

    return {
        isMultipleChoice,
        isNumerical,
        numericalAnswer,
        selectedAnswerIdxs,
        submitted,
        hasAnswer,
        score,
        showResultFeedback,
        isAnswerChecked,
        showFeedback,
        onSelectedAnswerChange,
        onNumericalAnswerChange,
        selectAndSubmit,
        submit,
        attemptSubmit: () => {
            if (hasAnswer) submit()
        },
    }
}
