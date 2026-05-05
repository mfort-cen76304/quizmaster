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
    readonly onGenerated: (drafts: readonly QuestionDraft[]) => void | Promise<void>
    readonly generateRequest?: (request: {
        question: string
        questionType: QuestionType
        workspaceGuid?: string
    }) => Promise<readonly QuestionDraft[]>
    readonly undo: RobinUndoBuffer
    readonly questionType: QuestionType
    readonly workspaceGuid?: string
    readonly onClose: () => void
    readonly closeOnGenerated?: boolean
}

const generateSingleDraft = async (request: {
    question: string
    questionType: QuestionType
    workspaceGuid?: string
}): Promise<readonly QuestionDraft[]> => [await postAiAssistant(request)]

export const useRobinPromptForm = ({
    onGenerated,
    generateRequest = generateSingleDraft,
    undo,
    questionType,
    workspaceGuid,
    onClose,
    closeOnGenerated = true,
}: UseRobinPromptFormArgs) => {
    const [promptText, setPromptText] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const generate = async () => {
        setError('')
        setLoading(true)
        try {
            const response = await generateRequest({ question: promptText.trim(), questionType, workspaceGuid })
            undo.capture()
            await onGenerated(response)
            if (closeOnGenerated) onClose()
        } catch (e) {
            const message = e instanceof Error ? e.message : 'AI assistant request failed.'
            setError(message || 'AI assistant request failed.')
        } finally {
            setLoading(false)
        }
    }

    return { promptText, setPromptText, loading, error, generate }
}
