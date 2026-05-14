import React from 'react'

import {
    type AnswerIdxs,
    type AnswerStatus,
    type Question,
    type QuestionAnswer,
    type QuestionEvaluation,
    type QuestionTake,
    choiceAnswer,
    numericalAnswer,
} from '#fe/take/model/question.ts'

import { shouldShowAnswerCount } from './question-display.ts'
import { useQuizQuestionContext } from './quiz-question-context.tsx'

export interface QuestionTakeState {
    readonly isMultipleChoice: boolean
    readonly isNumerical: boolean
    readonly showAnswerCount: boolean
    readonly numericalAnswer: string
    readonly selectedAnswerIdxs: AnswerIdxs
    readonly submitted: boolean
    readonly submitting: boolean
    readonly hasAnswer: boolean
    readonly status: AnswerStatus
    readonly score: number
    readonly showResultFeedback: boolean
    readonly feedbackQuestion: Question | undefined
    readonly isAnswerChecked: (idx: number) => boolean
    readonly showFeedback: (idx: number) => boolean
    readonly onSelectedAnswerChange: (idx: number, selected: boolean) => void
    readonly onNumericalAnswerChange: (value: string) => void
    readonly selectAndSubmit: (idx: number) => void
    readonly submit: () => Promise<void>
    readonly attemptSubmit: () => Promise<void>
}

export const useQuestionTakeState = (question: Question | QuestionTake): QuestionTakeState => {
    const quizContext = useQuizQuestionContext()
    const onSubmitted = quizContext?.onSubmitted
    const onAnswerSelected = quizContext?.onAnswerSelected
    const showFeedbackOnSubmit = quizContext?.showFeedbackOnSubmit ?? true
    const initialAnswerIdxs = quizContext?.selectedAnswerIdxs ?? []

    const isNumerical = question.questionType === 'numerical'
    const authoringQuestion = 'correctAnswers' in question ? question : undefined
    const correctAnswerCount =
        'correctAnswers' in question ? question.correctAnswers.length : question.correctAnswerCount
    const isMultipleChoice = correctAnswerCount > 1

    const [selectedAnswerIdxs, setSelectedAnswerIdxs] = React.useState<AnswerIdxs>(initialAnswerIdxs)
    const [numericalInput, setNumericalInput] = React.useState('')
    const [submitted, setSubmitted] = React.useState(false)
    const [submitting, setSubmitting] = React.useState(false)
    const [remoteEvaluation, setRemoteEvaluation] = React.useState<QuestionEvaluation | undefined>(undefined)

    const currentAnswer: QuestionAnswer | undefined = isNumerical
        ? numericalAnswer(numericalInput)
        : choiceAnswer(selectedAnswerIdxs)

    const hasAnswer = currentAnswer !== undefined
    const result: QuestionEvaluation | undefined = remoteEvaluation

    const showFeedback = (idx: number) =>
        submitted && showFeedbackOnSubmit && (isMultipleChoice || selectedAnswerIdxs[0] === idx)

    const isAnswerChecked = (idx: number) => selectedAnswerIdxs.includes(idx)

    const showResultFeedback = submitted && showFeedbackOnSubmit && result !== undefined
    const showAnswerCount = shouldShowAnswerCount(
        isMultipleChoice,
        question.isEasy,
        quizContext?.difficulty ?? 'keep-question',
    )

    const submit = React.useCallback(async () => {
        if (!currentAnswer || submitting) return
        setSubmitting(true)
        try {
            const evaluation = await onSubmitted?.(currentAnswer)
            if (evaluation) setRemoteEvaluation(evaluation)
            // HACK: Numerical answers also poke selectedAnswerIdxs so the parent's
            // onAnswerSelected effect signals "has selection" via [0]/[1]. To be
            // removed once the parent stops piggybacking on AnswerIdxs for the
            // has-selection signal. Covered by the upcoming Quiz.Mode.feature
            // "Learn mode - Numerical question" scenario.
            const finalIdxs = isNumerical
                ? evaluation && evaluation.status !== 'CORRECT'
                    ? [1]
                    : [0]
                : selectedAnswerIdxs
            setSelectedAnswerIdxs(finalIdxs)
            setSubmitted(true)
        } finally {
            setSubmitting(false)
        }
    }, [isNumerical, currentAnswer, selectedAnswerIdxs, onSubmitted, submitting])

    const selectAndSubmit = React.useCallback(
        async (idx: number) => {
            if (submitting) return
            const answer = choiceAnswer([idx])
            if (!answer) return
            setSubmitting(true)
            try {
                const evaluation = await onSubmitted?.(answer)
                if (evaluation) setRemoteEvaluation(evaluation)
                setSelectedAnswerIdxs([idx])
                setSubmitted(true)
            } finally {
                setSubmitting(false)
            }
        },
        [onSubmitted, submitting],
    )

    const onSelectedAnswerChange = (idx: number, selected: boolean) => {
        if (isNumerical) return
        setSubmitted(false)
        setSubmitting(false)
        setRemoteEvaluation(undefined)
        if (!isMultipleChoice) setSelectedAnswerIdxs([idx])
        else if (selected) setSelectedAnswerIdxs(prev => [...prev, idx])
        else setSelectedAnswerIdxs(prev => prev.filter(i => i !== idx))
    }

    React.useEffect(() => {
        onAnswerSelected?.(selectedAnswerIdxs)
    }, [selectedAnswerIdxs, onAnswerSelected])

    const onNumericalAnswerChange = (value: string) => {
        setSubmitted(false)
        setSubmitting(false)
        setRemoteEvaluation(undefined)
        setNumericalInput(value)
    }

    return {
        isMultipleChoice,
        isNumerical,
        showAnswerCount,
        numericalAnswer: numericalInput,
        selectedAnswerIdxs,
        submitted,
        submitting,
        hasAnswer,
        status: result?.status ?? 'UNANSWERED',
        score: result?.score ?? 0,
        showResultFeedback,
        feedbackQuestion: remoteEvaluation?.question ?? authoringQuestion,
        isAnswerChecked,
        showFeedback,
        onSelectedAnswerChange,
        onNumericalAnswerChange,
        selectAndSubmit,
        submit,
        attemptSubmit: async () => {
            if (hasAnswer) await submit()
        },
    }
}
