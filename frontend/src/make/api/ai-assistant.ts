import { postJson } from '#fe/shared/api/helpers.ts'
import type { QuestionDraft, QuestionType } from '#fe/shared/model/question.ts'

interface AiAssistantRequest {
    readonly question: string
    readonly questionType: QuestionType
    readonly excludedQuestionId?: number
}

export const postAiAssistant = async (workspaceGuid: string, request: AiAssistantRequest) =>
    await postJson<AiAssistantRequest, QuestionDraft>(`/api/workspaces/${workspaceGuid}/ai-assistant`, request)

export const postAiAssistantBatch = async (workspaceGuid: string, request: AiAssistantRequest) =>
    await postJson<AiAssistantRequest, readonly QuestionDraft[]>(
        `/api/workspaces/${workspaceGuid}/ai-assistant/batch`,
        request,
    )
