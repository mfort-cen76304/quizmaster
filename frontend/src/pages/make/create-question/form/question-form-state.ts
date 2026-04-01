import { useRef, useState } from 'react'
import { updated } from 'helpers.ts'
import type { Question } from 'model/question.ts'
import type { QuestionApiData } from 'api/question.ts'
import type { AiAssistantResponse } from '../../../../api/ai-assistant.ts'

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
}

export type QuestionType = 'single' | 'multiple' | 'numerical'

const parseTagFromQuestion = (raw: string): { tag: string; title: string } => {
    const match = /^\[([^\]]+)\] (.+)$/.exec(raw)
    return match ? { tag: match[1], title: match[2] } : { tag: '', title: raw }
}

export const useQuestionFormState = (question?: Question) => {
    const isQuestionNumerical =
        (question?.answers?.length || 0) === 1 &&
        (question?.correctAnswers?.length || 0) === 1 &&
        question?.correctAnswers?.[0] === 0 &&
        /^-?\d+(\.\d+)?$/.test(question?.answers?.[0] || '')

    const { tag: initialTag, title: initialTitle } = parseTagFromQuestion(question?.question || '')

    const [aiPromptText, setAiPromptText] = useState<string>(question?.aiPrompt || '')
    const [questionText, setQuestionText] = useState<string>(initialTitle)
    const [tagText, setTagText] = useState<string>(initialTag)
    const [questionType, setQuestionType] = useState<QuestionType>(
        isQuestionNumerical ? 'numerical' : (question?.correctAnswers?.length || 0) > 1 ? 'multiple' : 'single',
    )
    const [numericalAnswer, setNumericalAnswer] = useState(isQuestionNumerical ? (question?.answers?.[0] ?? '') : '')
    const [tolerance, setTolerance] = useState(question?.tolerance != null ? String(question.tolerance) : '')
    const [isEasy, setIsEasy] = useState(question?.isEasy || false)
    const [showExplanations, setShowExplanations] = useState(
        question?.explanations?.some(explanation => !!explanation) ?? false,
    )
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
        setAnswerIds([...answerIds, genId()])
    }

    const applyAiResponse = (response: AiAssistantResponse) => {
        const responseExplanations =
            response.explanations?.length === response.answers.length
                ? response.explanations.map(explanation => explanation ?? '')
                : response.answers.map(() => '')

        setQuestionText(response.question)
        setQuestionType(response.correctAnswers.length > 1 ? 'multiple' : 'single')
        setAnswers(response.answers)
        setExplanations(responseExplanations)
        setCorrectAnswers(Array.from(response.correctAnswers))
        setShowExplanations(responseExplanations.some(explanation => explanation.trim() !== ''))
        setNumericalAnswer('')
        setTolerance('')
        setIsEasy(false)
        setAnswerIds(response.answers.map(() => genId()))
    }

    const removeAnswer = (idx: number) => {
        setAnswers([...answers.filter((_, i) => i !== idx)])
        setExplanations([...explanations.filter((_, i) => i !== idx)])
        setAnswerIds([...answerIds.filter((_, i) => i !== idx)])

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
    }
}

const buildQuestionTitle = (tagText: string, questionText: string): string => {
    const tag = tagText.trim()
    return tag ? `[${tag}] ${questionText}` : questionText
}

export const stateToQuestionApiData = (state: QuestionFormState): QuestionApiData => {
    if (state.isNumerical) {
        const normalizedTolerance = state.tolerance.trim()
        const parsedTolerance = normalizedTolerance === '' ? undefined : Number.parseFloat(normalizedTolerance)
        return {
            question: buildQuestionTitle(state.tagText, state.questionText),
            answers: [state.numericalAnswer.trim()],
            correctAnswers: [0],
            explanations: [''],
            questionExplanation: state.questionExplanation,
            isEasy: false,
            tolerance: Number.isNaN(parsedTolerance) ? undefined : parsedTolerance,
        }
    }

    return {
        question: buildQuestionTitle(state.tagText, state.questionText),
        answers: Array.from(state.answers),
        correctAnswers: Array.from(state.correctAnswers),
        explanations: Array.from(state.explanations),
        questionExplanation: state.questionExplanation,
        isEasy: state.isEasy,
        imageUrl: state.imageUrl || undefined,
    }
}
