import { useState } from 'react'

import { type AiAssistantResponse, postAiAssistant } from '#api/ai-assistant.ts'
import type { QuestionType } from '#model/question.ts'
import { NUM_DEFAULT_ANSWERS } from '#shared/defaults/question.ts'

import type { QuestionFormStatePatch } from '../form/question-form-state.ts'
import type { RobinUndoBuffer } from './use-robin-undo-buffer.ts'

export interface RobinFormBinding {
    readonly snapshot: () => QuestionFormStatePatch
    readonly applyPatch: (patch: QuestionFormStatePatch) => void
}

const TYPE_INSTRUCTIONS: Record<QuestionType, string> = {
    single: 'This must be a single choice question with exactly 1 correct answer. Return a non-empty explanation for every answer.',
    multiple:
        'This must be a multiple choice question with at least 2 correct answers. Never return exactly 1 correct answer. Return a non-empty explanation for every answer.',
    numerical:
        'This should be suitable for a numerical quiz question asking for just one numeric value. Include exactly 1 correct numeric answer and at least 1 incorrect answer. Return a non-empty explanation for every answer and return non-empty questionExplanation when requested.',
}

const buildAiPrompt = (prompt: string, questionType: QuestionType): string => {
    const trimmedPrompt = prompt.trim()
    const typeInstruction = TYPE_INSTRUCTIONS[questionType]
    return typeInstruction ? `${trimmedPrompt}\n\n${typeInstruction}` : trimmedPrompt
}

const emptySlots = <T>(value: T): readonly T[] => Array(NUM_DEFAULT_ANSWERS).fill(value)

const responseToPatch = (response: AiAssistantResponse, requestedType: QuestionType): QuestionFormStatePatch => {
    if (requestedType === 'numerical') {
        const firstCorrectIndex = response.correctAnswers[0]
        const selectedAnswer =
            firstCorrectIndex != null && firstCorrectIndex >= 0 && firstCorrectIndex < response.answers.length
                ? response.answers[firstCorrectIndex]
                : ''

        return {
            questionText: response.question,
            questionExplanation: response.questionExplanation ?? '',
            questionType: 'numerical',
            numericalAnswer: selectedAnswer,
            tolerance: response.tolerance ?? 0,
            isEasy: false,
            answers: emptySlots(''),
            explanations: emptySlots(''),
            correctAnswers: [],
            showExplanations: false,
        }
    }

    const responseExplanations =
        response.explanations?.length === response.answers.length
            ? response.explanations.map(explanation => explanation ?? '')
            : response.answers.map(() => '')

    return {
        questionText: response.question,
        questionExplanation: response.questionExplanation ?? '',
        questionType: response.correctAnswers.length > 1 ? 'multiple' : 'single',
        answers: response.answers,
        explanations: responseExplanations,
        correctAnswers: Array.from(response.correctAnswers),
        showExplanations: responseExplanations.some(explanation => explanation !== ''),
        numericalAnswer: '',
        tolerance: 0,
        isEasy: false,
    }
}

interface UseRobinPromptFormArgs {
    readonly form: RobinFormBinding
    readonly undo: RobinUndoBuffer
    readonly questionType: QuestionType
    readonly onClose: () => void
}

export const useRobinPromptForm = ({ form, undo, questionType, onClose }: UseRobinPromptFormArgs) => {
    const [promptText, setPromptText] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const generate = async () => {
        setError('')
        setLoading(true)
        try {
            const response = await postAiAssistant(buildAiPrompt(promptText, questionType))
            undo.capture()
            form.applyPatch(responseToPatch(response, questionType))
            onClose()
        } catch (e) {
            const message = e instanceof Error ? e.message : 'AI assistant request failed.'
            setError(message || 'AI assistant request failed.')
        } finally {
            setLoading(false)
        }
    }

    return { promptText, setPromptText, loading, error, generate }
}
