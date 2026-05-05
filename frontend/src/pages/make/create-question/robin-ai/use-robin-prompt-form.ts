import { useState } from 'react'

import { postAiAssistant } from '#api/ai-assistant.ts'
import type { QuestionDraft, QuestionType } from '#model/question.ts'

import type { QuestionFormStatePatch } from '../form/question-form-state.ts'
import type { RobinUndoBuffer } from './use-robin-undo-buffer.ts'

export interface RobinFormBinding {
    readonly snapshot: () => QuestionFormStatePatch
    readonly applyPatch: (patch: QuestionFormStatePatch) => void
}

const questionToPatch = (q: QuestionDraft): QuestionFormStatePatch => ({
    questionText: q.question,
    questionType: q.questionType,
    answers: q.answers,
    explanations: q.explanations,
    correctAnswers: Array.from(q.correctAnswers),
    questionExplanation: q.questionExplanation,
    isEasy: q.isEasy,
    showExplanations: q.explanations.some(explanation => !!explanation),
    numericalAnswer: q.questionType === 'numerical' ? (q.answers[0] ?? '') : '',
    tolerance: q.tolerance ?? 0,
})

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
            const response = await postAiAssistant({ question: promptText.trim(), questionType })
            undo.capture()
            form.applyPatch(questionToPatch(response))
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
