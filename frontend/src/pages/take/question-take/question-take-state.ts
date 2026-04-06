import { useState } from 'react'

import { isNumericalQuestion, type AnswerIdxs } from '#model/question'

import type { QuestionFormProps } from './question-form'

export interface QuestionTakeState {
    readonly isMultipleChoice: boolean
    readonly isNumerical: boolean
    readonly numericalAnswer: string
    readonly selectedAnswerIdxs: AnswerIdxs
    readonly submitted: boolean
    readonly submit: () => void
    readonly onSelectedAnswerChange: (idx: number, selected: boolean) => void
    readonly onNumericalAnswerChange: (value: string) => void
    readonly isAnswerChecked: (idx: number) => boolean
    readonly hasAnswer: boolean
}

export const useQuestionTakeState = (props: QuestionFormProps): QuestionTakeState => {
    const question = props.question
    const isNumerical = isNumericalQuestion(question)
    const isMultipleChoice = question.correctAnswers.length > 1
    const correctNumericalAnswer = question.answers[0] ?? ''

    const [selectedAnswerIdxs, setSelectedAnswerIdxs] = useState<AnswerIdxs>(props.selectedAnswerIdxs ?? [])
    const [numericalAnswer, setNumericalAnswer] = useState('')

    const setSelectedAnswerIdx = (idx: number) => setSelectedAnswerIdxs([idx])
    const addSelectedAnswerIdx = (idx: number) => setSelectedAnswerIdxs(prev => [...prev, idx])
    const removeSelectedAnswerIdx = (idx: number) => setSelectedAnswerIdxs(prev => prev.filter(i => i !== idx))

    const [submitted, setSubmitted] = useState(false)

    const submit = () => setSubmitted(true)

    const onSelectedAnswerChange = (idx: number, selected: boolean) => {
        if (isNumerical) return
        setSubmitted(false)
        if (!isMultipleChoice) setSelectedAnswerIdx(idx)
        else if (selected) addSelectedAnswerIdx(idx)
        else removeSelectedAnswerIdx(idx)
    }

    const tolerance = question.tolerance ?? 0

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

    const isAnswerChecked = (idx: number) => {
        return selectedAnswerIdxs.includes(idx)
    }

    const hasAnswer = isNumerical ? numericalAnswer.trim() !== '' : selectedAnswerIdxs.length > 0

    return {
        isMultipleChoice,
        isNumerical,
        numericalAnswer,
        selectedAnswerIdxs,
        submitted,
        submit,
        onSelectedAnswerChange,
        onNumericalAnswerChange,
        isAnswerChecked,
        hasAnswer,
    }
}
