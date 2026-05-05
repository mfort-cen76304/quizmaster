import type { QuestionDraft, QuestionType } from '#model/question.ts'

import { postJson } from './helpers.ts'

interface AiAssistantRequest {
    readonly question: string
    readonly questionType: QuestionType
}

export const postAiAssistant = async (request: AiAssistantRequest) =>
    await postJson<AiAssistantRequest, QuestionDraft>('/api/ai-assistant', request)

export const postAiAssistantBatch = async (request: AiAssistantRequest) =>
    await postJson<AiAssistantRequest, readonly QuestionDraft[]>('/api/ai-assistant/batch', request)
