import { useState } from 'react'

import { postAiAssistant } from '#fe/make/api/ai-assistant.ts'
import type { QuestionDraft, QuestionType } from '#fe/shared/model/question.ts'

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

export interface RobinGenerateRequest {
    readonly workspaceGuid: string
    readonly question: string
    readonly questionType: QuestionType
    readonly currentDrafts: readonly QuestionDraft[]
}

interface UseRobinPromptFormArgs {
    readonly onGenerated: (drafts: readonly QuestionDraft[]) => void | Promise<void>
    readonly generateRequest?: (request: RobinGenerateRequest) => Promise<RobinGenerationResult>
    readonly undo: RobinUndoBuffer
    readonly workspaceId: string
    readonly questionType: QuestionType
    readonly onClose: () => void
    readonly closeOnGenerated?: boolean
    readonly mode?: 'classic' | 'chat'
}

const generateSingleDraft = async ({
    workspaceGuid,
    question,
    questionType,
}: RobinGenerateRequest): Promise<RobinGenerationResult> => ({
    drafts: [await postAiAssistant(workspaceGuid, { question, questionType })],
})

export const useRobinPromptForm = ({
    onGenerated,
    generateRequest = generateSingleDraft,
    undo,
    workspaceId,
    questionType,
    onClose,
    closeOnGenerated = true,
    mode = 'classic',
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
        setPromptText('')
        try {
            const response = await generateRequest({
                workspaceGuid: workspaceId,
                question: submittedPrompt,
                questionType,
                currentDrafts: generatedDrafts,
            })
            undo.capture()
            await onGenerated(response.drafts)
            if (mode === 'chat') {
                const nextMessages: RobinChatMessage[] = [{ role: 'user', text: submittedPrompt }]
                if (response.assistantMessage) {
                    nextMessages.push({ role: 'assistant', text: response.assistantMessage })
                }

                setGeneratedDrafts(response.drafts)
                setChatMessages(messages => [...messages, ...nextMessages])
            }
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
