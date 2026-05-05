import { useState } from 'react'

import { postAiAssistant } from '#api/ai-assistant.ts'
import type { QuestionDraft, QuestionType } from '#model/question.ts'

import type { QuestionFormStatePatch } from '../form/question-form-state.ts'
import type { RobinUndoBuffer } from './use-robin-undo-buffer.ts'

export interface RobinFormBinding {
    readonly snapshot: () => QuestionFormStatePatch
    readonly applyPatch: (patch: QuestionFormStatePatch) => void
}

export interface RobinChatMessage {
    readonly role: 'user' | 'assistant'
    readonly text: string
}

export interface RobinGenerationResult {
    readonly drafts: readonly QuestionDraft[]
    readonly assistantMessage?: string
}

interface UseRobinPromptFormArgs {
    readonly onGenerated: (drafts: readonly QuestionDraft[]) => void | Promise<void>
    readonly generateRequest?: (request: {
        question: string
        questionType: QuestionType
        workspaceGuid?: string
        currentDrafts: readonly QuestionDraft[]
    }) => Promise<RobinGenerationResult>
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
    currentDrafts: readonly QuestionDraft[]
}): Promise<RobinGenerationResult> => ({ drafts: [await postAiAssistant(request)] })

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
    const [generatedDrafts, setGeneratedDrafts] = useState<readonly QuestionDraft[]>([])
    const [chatMessages, setChatMessages] = useState<readonly RobinChatMessage[]>([])

    const generate = async () => {
        const submittedPrompt = promptText.trim()
        if (!submittedPrompt) return
        setError('')
        setLoading(true)
        try {
            const response = await generateRequest({
                question: submittedPrompt,
                questionType,
                workspaceGuid,
                currentDrafts: generatedDrafts,
            })
            const nextMessages: RobinChatMessage[] = [{ role: 'user', text: submittedPrompt }]
            if (response.assistantMessage) {
                nextMessages.push({ role: 'assistant', text: response.assistantMessage })
            }

            setGeneratedDrafts(response.drafts)
            setChatMessages(messages => [...messages, ...nextMessages])
            setPromptText('')
            undo.capture()
            await onGenerated(response.drafts)
            if (closeOnGenerated) onClose()
        } catch (e) {
            const message = e instanceof Error ? e.message : 'AI assistant request failed.'
            setError(message || 'AI assistant request failed.')
        } finally {
            setLoading(false)
        }
    }

    return { promptText, setPromptText, loading, error, generate, generatedDrafts, chatMessages }
}
