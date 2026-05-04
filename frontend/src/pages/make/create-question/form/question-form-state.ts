import { useRef, useState } from 'react'

import type { QuestionRequest } from '#api/question.ts'
import { updated } from '#fe/helpers.ts'
import type { Question, QuestionType } from '#model/question.ts'
import { NUM_DEFAULT_ANSWERS } from '#shared/defaults/question.ts'

const emptyAnswerSlots = <T>(value: T): readonly T[] => Array(NUM_DEFAULT_ANSWERS).fill(value)

export interface AnswerState {
    readonly id: number
    readonly answer: string
    readonly explanation: string
    readonly isCorrect: boolean
    readonly setAnswer: (value: string) => void
    readonly setExplanation: (value: string) => void
    readonly toggleCorrect: () => void
}

export interface QuestionFormState {
    readonly questionText: string
    readonly tagText: string
    readonly answers: readonly string[]
    readonly explanations: readonly string[]
    readonly correctAnswers: readonly number[]
    readonly questionType: QuestionType
    readonly numericalAnswer: string
    readonly tolerance: number
    readonly isNumerical: boolean
    readonly isMultipleChoice: boolean
    readonly isEasy: boolean
    readonly questionExplanation: string
    readonly showExplanations: boolean
    readonly imageUrl: string
}

export interface QuestionFormStatePatch {
    readonly questionText?: string
    readonly questionType?: QuestionType
    readonly answers?: readonly string[]
    readonly explanations?: readonly string[]
    readonly correctAnswers?: readonly number[]
    readonly questionExplanation?: string
    readonly isEasy?: boolean
    readonly showExplanations?: boolean
    readonly numericalAnswer?: string
    readonly tolerance?: number
    readonly imageUrl?: string
}

export type { QuestionType }

export const useQuestionFormState = (question?: Question) => {
    const isQuestionNumerical = question?.questionType === 'numerical'

    const initialTag = question?.tags[0] || ''
    const initialTitle = question?.question || ''

    const [questionText, setQuestionText] = useState<string>(initialTitle)
    const [tagText, setTagText] = useState<string>(initialTag)
    const [questionType, setQuestionType] = useState<QuestionType>(question?.questionType ?? 'single')
    const [numericalAnswer, setNumericalAnswer] = useState(isQuestionNumerical ? (question?.answers?.[0] ?? '') : '')
    const [tolerance, setTolerance] = useState<number>(question?.tolerance ?? 0)
    const [isEasy, setIsEasy] = useState(question?.isEasy || false)
    const [showExplanations, setShowExplanations] = useState(
        question?.explanations?.some(explanation => !!explanation) ?? false,
    )
    const nextId = useRef(0)
    const genId = () => nextId.current++
    const [answerIds, setAnswerIds] = useState<readonly number[]>(() =>
        (question?.answers || emptyAnswerSlots('')).map(() => genId()),
    )
    const [answers, setAnswers] = useState<readonly string[]>(question?.answers || emptyAnswerSlots(''))
    const [explanations, setExplanations] = useState<readonly string[]>(question?.explanations || emptyAnswerSlots(''))
    const [correctAnswers, setCorrectAnswers] = useState<readonly number[]>(question?.correctAnswers || [])

    const [questionExplanation, setQuestionExplanation] = useState(question?.questionExplanation || '')
    const [imageUrl, setImageUrl] = useState(question?.imageUrl || '')

    const isMultipleChoice = questionType === 'multiple'
    const isNumerical = questionType === 'numerical'

    const selectQuestionType = (nextType: QuestionType) => {
        if (nextType === 'single' && correctAnswers.length > 1) {
            setCorrectAnswers([])
        }
        if (nextType !== 'multiple') {
            setIsEasy(false)
        }
        setQuestionType(nextType)
    }

    const setAnswer = (index: number, answer: string) => setAnswers(updated(answers, index, answer))

    const setExplanation = (index: number, explanation: string) =>
        setExplanations(updated(explanations, index, explanation))

    const toggleCorrect = (index: number) => {
        if (isMultipleChoice) {
            setCorrectAnswers(
                correctAnswers.includes(index) ? correctAnswers.filter(i => i !== index) : [...correctAnswers, index],
            )
        } else {
            setCorrectAnswers(correctAnswers.includes(index) ? [] : [index])
        }
    }

    const addAnswer = () => {
        setAnswers([...answers, ''])
        setExplanations([...explanations, ''])
        setAnswerIds([...answerIds, genId()])
    }

    const removeAnswer = (idx: number) => {
        setAnswers(answers.filter((_, i) => i !== idx))
        setExplanations(explanations.filter((_, i) => i !== idx))
        setAnswerIds(answerIds.filter((_, i) => i !== idx))

        const sortedCorrectAnswers = [...correctAnswers]
            .sort((a, b) => a - b)
            .filter(item => item !== idx)
            .map(item => (item >= idx ? item - 1 : item))
        setCorrectAnswers(sortedCorrectAnswers)
    }

    const snapshot = (): QuestionFormStatePatch => ({
        questionText,
        questionType,
        answers,
        explanations,
        correctAnswers,
        questionExplanation,
        isEasy,
        showExplanations,
        numericalAnswer,
        tolerance,
        imageUrl,
    })

    const applyPatch = (patch: QuestionFormStatePatch) => {
        if (patch.questionText !== undefined) setQuestionText(patch.questionText)
        if (patch.questionType !== undefined) setQuestionType(patch.questionType)
        if (patch.answers !== undefined) {
            setAnswers(patch.answers)
            setAnswerIds(patch.answers.map(() => genId()))
        }
        if (patch.explanations !== undefined) setExplanations(patch.explanations)
        if (patch.correctAnswers !== undefined) setCorrectAnswers(patch.correctAnswers)
        if (patch.questionExplanation !== undefined) setQuestionExplanation(patch.questionExplanation)
        if (patch.isEasy !== undefined) setIsEasy(patch.isEasy)
        if (patch.showExplanations !== undefined) setShowExplanations(patch.showExplanations)
        if (patch.numericalAnswer !== undefined) setNumericalAnswer(patch.numericalAnswer)
        if (patch.tolerance !== undefined) setTolerance(patch.tolerance)
        if (patch.imageUrl !== undefined) setImageUrl(patch.imageUrl)
    }

    const answerStates: readonly AnswerState[] = answers.map((answer, index) => ({
        id: answerIds[index],
        answer,
        explanation: explanations[index] || '',
        isCorrect: correctAnswers.includes(index),
        setAnswer: (value: string) => setAnswer(index, value),
        setExplanation: (value: string) => setExplanation(index, value),
        toggleCorrect: () => toggleCorrect(index),
    }))

    return {
        questionText,
        tagText,
        answerStates,
        answers,
        explanations,
        correctAnswers,
        questionType,
        numericalAnswer,
        tolerance,
        isNumerical,
        questionExplanation,
        isMultipleChoice,
        isEasy,
        showExplanations,
        imageUrl,
        setQuestionText,
        setTagText,
        addAnswer,
        removeAnswer,
        setQuestionExplanation,
        selectQuestionType,
        setNumericalAnswer,
        setTolerance,
        setIsEasy,
        setShowExplanations,
        setImageUrl,
        snapshot,
        applyPatch,
    }
}

export type QuestionFormStateApi = ReturnType<typeof useQuestionFormState>

const buildTags = (tagText: string): string[] => {
    const tag = tagText.trim()
    return tag ? [tag] : []
}

export const stateToQuestionApiData = (state: QuestionFormState): QuestionRequest => {
    if (state.isNumerical) {
        return {
            question: state.questionText,
            answers: [state.numericalAnswer.trim()],
            correctAnswers: [0],
            explanations: [''],
            questionExplanation: state.questionExplanation,
            questionType: state.questionType,
            isEasy: false,
            tolerance: state.tolerance,
            tags: buildTags(state.tagText),
        }
    }

    return {
        question: state.questionText,
        answers: Array.from(state.answers),
        correctAnswers: Array.from(state.correctAnswers),
        explanations: Array.from(state.explanations),
        questionExplanation: state.questionExplanation,
        questionType: state.questionType,
        isEasy: state.isEasy,
        imageUrl: state.imageUrl || undefined,
        tags: buildTags(state.tagText),
    }
}
