import type { QuestionDraft, QuestionType } from '#model/question.ts'

import { postJson, workspaceKeyHeaders } from './helpers.ts'

interface AiAssistantRequest {
    readonly question: string
    readonly questionType: QuestionType
    readonly excludedQuestionId?: number
}

export const postAiAssistant = async (workspaceKey: string, request: AiAssistantRequest) =>
    await postJson<AiAssistantRequest, QuestionDraft>('/api/ai-assistant', request, {
        headers: workspaceKeyHeaders(workspaceKey),
    })

export const postAiAssistantBatch = async (workspaceKey: string, request: AiAssistantRequest) =>
    await postJson<AiAssistantRequest, readonly QuestionDraft[]>('/api/ai-assistant/batch', request, {
        headers: workspaceKeyHeaders(workspaceKey),
    })
