import { useState } from 'react'

import { postAiAssistant } from '#api/ai-assistant.ts'
import type { QuestionDraft, QuestionType } from '#model/question.ts'

import type { QuestionFormStatePatch } from '../form/question-form-state.ts'
import type { RobinUndoBuffer } from './use-robin-undo-buffer.ts'

export interface RobinFormBinding {
    readonly snapshot: () => QuestionFormStatePatch
    readonly applyPatch: (patch: QuestionFormStatePatch) => void
}

interface UseRobinPromptFormArgs {
    readonly onGenerated: (draft: QuestionDraft) => void | Promise<void>
    readonly undo: RobinUndoBuffer
    readonly questionType: QuestionType
    readonly onClose: () => void
}

export const useRobinPromptForm = ({ onGenerated, undo, questionType, onClose }: UseRobinPromptFormArgs) => {
    const [promptText, setPromptText] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const generate = async () => {
        setError('')
        setLoading(true)
        try {
            const response = await postAiAssistant({ question: promptText.trim(), questionType })
            undo.capture()
            await onGenerated(response)
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
