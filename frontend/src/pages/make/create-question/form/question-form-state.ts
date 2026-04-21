import { useRef, useState } from 'react'

import type { AiAssistantResponse } from '#api/ai-assistant.ts'
import type { QuestionApiData } from '#api/question.ts'
import { updated } from '#fe/helpers.ts'
import type { Question, QuestionType } from '#model/question.ts'

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
    readonly tolerance: string
    readonly isNumerical: boolean
    readonly isMultipleChoice: boolean
    readonly isEasy: boolean
    readonly questionExplanation: string
    readonly showExplanations: boolean
    readonly imageUrl: string
    readonly isAiGenerated: boolean
}

export type { QuestionType }

export const useQuestionFormState = (question?: Question) => {
    const isQuestionNumerical = question?.questionType === 'numerical'

    const initialTag = question?.tags[0] || ''
    const initialTitle = question?.question || ''

    const [aiPromptText, setAiPromptText] = useState('')
    const [questionText, setQuestionText] = useState<string>(initialTitle)
    const [tagText, setTagText] = useState<string>(initialTag)
    const [questionType, setQuestionType] = useState<QuestionType>(question?.questionType ?? 'single')
    const [numericalAnswer, setNumericalAnswer] = useState(isQuestionNumerical ? (question?.answers?.[0] ?? '') : '')
    const [tolerance, setTolerance] = useState(question?.tolerance != null ? String(question.tolerance) : '')
    const [isEasy, setIsEasy] = useState(question?.isEasy || false)
    const [showExplanations, setShowExplanations] = useState(
        question?.explanations?.some(explanation => !!explanation) ?? false,
    )
    const [isAiGenerated, setIsAiGenerated] = useState(false)
    const [generatedExplanations, setGeneratedExplanations] = useState<readonly string[]>([])
    const nextId = useRef(0)
    const genId = () => nextId.current++
    const [answerIds, setAnswerIds] = useState<readonly number[]>(() =>
        (question?.answers || ['', '']).map(() => genId()),
    )
    const [answers, setAnswers] = useState<readonly string[]>(question?.answers || ['', ''])
    const [explanations, setExplanations] = useState<readonly string[]>(question?.explanations || ['', ''])
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
        setGeneratedExplanations([...generatedExplanations, ''])
        setAnswerIds([...answerIds, genId()])
    }

    const applyAiResponse = (response: AiAssistantResponse) => {
        if (questionType === 'numerical') {
            const firstCorrectIndex = response.correctAnswers[0]
            const selectedAnswer =
                firstCorrectIndex != null && firstCorrectIndex >= 0 && firstCorrectIndex < response.answers.length
                    ? response.answers[firstCorrectIndex]
                    : ''

            setQuestionText(response.question)
            setQuestionExplanation(response.questionExplanation ?? '')
            setQuestionType('numerical')
            setNumericalAnswer(selectedAnswer)
            // Apply tolerance from AI response if provided, otherwise leave as is
            if (response.tolerance != null) {
                setTolerance(String(response.tolerance))
            }
            setIsEasy(false)
            setIsAiGenerated(false)
            setAnswers(['', ''])
            setExplanations(['', ''])
            setGeneratedExplanations([])
            setCorrectAnswers([])
            setShowExplanations(false)
            setAnswerIds([genId(), genId()])
            return
        }

        const responseExplanations =
            response.explanations?.length === response.answers.length
                ? response.explanations.map(explanation => explanation ?? '')
                : response.answers.map(() => '')

        setQuestionText(response.question)
        setQuestionExplanation(response.questionExplanation ?? '')
        setQuestionType(response.correctAnswers.length > 1 ? 'multiple' : 'single')
        setAnswers(response.answers)
        setExplanations(response.answers.map(() => ''))
        setGeneratedExplanations(responseExplanations)
        setCorrectAnswers(Array.from(response.correctAnswers))
        setShowExplanations(false)
        setNumericalAnswer('')
        setTolerance('')
        setIsEasy(false)
        setIsAiGenerated(true)
        setAnswerIds(response.answers.map(() => genId()))
    }

    const generateExplanations = () => {
        setExplanations(Array.from(generatedExplanations))
        setShowExplanations(true)
    }

    const removeAnswer = (idx: number) => {
        setAnswers(answers.filter((_, i) => i !== idx))
        setExplanations(explanations.filter((_, i) => i !== idx))
        setGeneratedExplanations(generatedExplanations.filter((_, i) => i !== idx))
        setAnswerIds(answerIds.filter((_, i) => i !== idx))

        const sortedCorrectAnswers = [...correctAnswers]
            .sort((a, b) => a - b)
            .filter(item => item !== idx)
            .map(item => (item >= idx ? item - 1 : item))
        setCorrectAnswers(sortedCorrectAnswers)
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
        aiPromptText,
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
        isAiGenerated,
        setQuestionText,
        setTagText,
        setAiPromptText,
        addAnswer,
        removeAnswer,
        setQuestionExplanation,
        selectQuestionType,
        setNumericalAnswer,
        setTolerance,
        setIsEasy,
        setShowExplanations,
        setImageUrl,
        applyAiResponse,
        generateExplanations,
    }
}

const buildTags = (tagText: string): string[] => {
    const tag = tagText.trim()
    return tag ? [tag] : []
}

export const stateToQuestionApiData = (state: QuestionFormState): QuestionApiData => {
    if (state.isNumerical) {
        const normalizedTolerance = state.tolerance.trim()
        const parsedTolerance = normalizedTolerance === '' ? undefined : Number.parseFloat(normalizedTolerance)
        return {
            question: state.questionText,
            answers: [state.numericalAnswer.trim()],
            correctAnswers: [0],
            explanations: [''],
            questionExplanation: state.questionExplanation,
            questionType: state.questionType,
            isEasy: false,
            tolerance: Number.isNaN(parsedTolerance) ? undefined : parsedTolerance,
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
