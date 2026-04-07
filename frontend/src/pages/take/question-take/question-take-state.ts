import React from 'react'

import {
    type AnswerIdxs,
    type Question,
    type QuestionAnswer,
    type QuestionResult,
    choiceAnswer,
    evaluateAnswer,
    numericalAnswer,
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

    const [selectedAnswerIdxs, setSelectedAnswerIdxs] = React.useState<AnswerIdxs>(initialAnswerIdxs)
    const [numericalInput, setNumericalInput] = React.useState('')
    const [submitted, setSubmitted] = React.useState(false)

    const currentAnswer: QuestionAnswer | undefined = isNumerical
        ? numericalAnswer(numericalInput)
        : choiceAnswer(selectedAnswerIdxs)

    const hasAnswer = currentAnswer !== undefined
    const result: QuestionResult | undefined = currentAnswer && evaluateAnswer(question, currentAnswer)

    const showFeedback = (idx: number) =>
        submitted && showFeedbackOnSubmit && (isMultipleChoice || selectedAnswerIdxs[0] === idx)

    const isAnswerChecked = (idx: number) => selectedAnswerIdxs.includes(idx)

    const showResultFeedback = submitted && showFeedbackOnSubmit
    const showAnswerCount = shouldShowAnswerCount(
        isMultipleChoice,
        question.isEasy,
        quizContext?.difficulty ?? 'keep-question',
    )

    const submit = React.useCallback(() => {
        if (!currentAnswer || !result) return
        // HACK: Numerical answers also poke selectedAnswerIdxs so the parent's
        // onAnswerSelected effect signals "has selection" via [0]/[1]. To be
        // removed once the parent stops piggybacking on AnswerIdxs for the
        // has-selection signal. Covered by the upcoming Quiz.Mode.feature
        // "Learn mode - Numerical question" scenario.
        const finalIdxs = isNumerical ? (result.correct ? [0] : [1]) : selectedAnswerIdxs
        setSelectedAnswerIdxs(finalIdxs)
        setSubmitted(true)
        onSubmitted?.(currentAnswer)
    }, [isNumerical, result, currentAnswer, selectedAnswerIdxs, onSubmitted])

    const selectAndSubmit = React.useCallback(
        (idx: number) => {
            const answer = choiceAnswer([idx])
            if (!answer) return
            setSelectedAnswerIdxs([idx])
            setSubmitted(true)
            onSubmitted?.(answer)
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
        setNumericalInput(value)
    }

    return {
        isMultipleChoice,
        isNumerical,
        showAnswerCount,
        numericalAnswer: numericalInput,
        selectedAnswerIdxs,
        submitted,
        hasAnswer,
        score: result?.score ?? 0,
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
