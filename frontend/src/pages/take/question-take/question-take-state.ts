import React from 'react'

import {
    type AnswerIdxs,
    type Question,
    compareAnswers,
    compareNumericalAnswer,
    calculateScore,
} from '#model/question.ts'

import { shouldShowAnswerCount } from './question-display.ts'
import { useQuizQuestionContext } from './quiz-question-context.tsx'

export interface QuestionTakeState {
    readonly isMultipleChoice: boolean
    readonly isNumerical: boolean
    readonly showAnswerCount: boolean
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

export const useQuestionTakeState = (question: Question): QuestionTakeState => {
    const quizContext = useQuizQuestionContext()
    const onSubmitted = quizContext?.onSubmitted
    const onAnswerSelected = quizContext?.onAnswerSelected
    const showFeedbackOnSubmit = quizContext?.showFeedbackOnSubmit ?? true
    const initialAnswerIdxs = quizContext?.selectedAnswerIdxs ?? []

    const isNumerical = question.questionType === 'numerical'
    const isMultipleChoice = question.correctAnswers.length > 1
    const correctNumericalAnswer = question.answers[0] ?? ''

    const [selectedAnswerIdxs, setSelectedAnswerIdxs] = React.useState<AnswerIdxs>(initialAnswerIdxs)
    const [numericalAnswer, setNumericalAnswer] = React.useState('')
    const [submitted, setSubmitted] = React.useState(false)

    const tolerance = question.tolerance ?? 0

    const comparison = isNumerical
        ? compareNumericalAnswer(numericalAnswer, correctNumericalAnswer, tolerance)
        : compareAnswers(selectedAnswerIdxs, question.correctAnswers)

    const score = calculateScore(comparison)

    const showFeedback = (idx: number) =>
        submitted && showFeedbackOnSubmit && (isMultipleChoice || selectedAnswerIdxs[0] === idx)

    const isAnswerChecked = (idx: number) => selectedAnswerIdxs.includes(idx)

    const hasAnswer = isNumerical ? numericalAnswer.trim() !== '' : selectedAnswerIdxs.length > 0
    const showResultFeedback = submitted && showFeedbackOnSubmit
    const showAnswerCount = shouldShowAnswerCount(
        isMultipleChoice,
        question.isEasy,
        quizContext?.difficulty ?? 'keep-question',
    )

    const submit = React.useCallback(() => {
        const finalIdxs = isNumerical ? (comparison.missedCorrect === 0 ? [0] : [1]) : selectedAnswerIdxs
        setSelectedAnswerIdxs(finalIdxs)
        setSubmitted(true)
        onSubmitted?.(finalIdxs)
    }, [isNumerical, comparison, selectedAnswerIdxs, onSubmitted])

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
        setNumericalAnswer(value)
    }

    return {
        isMultipleChoice,
        isNumerical,
        showAnswerCount,
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
