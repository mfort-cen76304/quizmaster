import { useState } from 'react'
import { createPortal } from 'react-dom'

import { postAiAssistant, postAiAssistantBatch } from '#fe/api/ai-assistant.ts'
import { saveQuestion } from '#fe/api/question.ts'
import type { QuestionDraft, QuestionType } from '#fe/model/question.ts'
import { questionDraftToRequest } from '#fe/pages/make/create-question/robin-ai/question-draft-mappers.ts'
import { RobinFab } from '#fe/pages/make/create-question/robin-ai/robin-fab.tsx'
import { RobinSheet } from '#fe/pages/make/create-question/robin-ai/robin-sheet.tsx'
import type {
    RobinGenerateRequest,
    RobinGenerationResult,
} from '#fe/pages/make/create-question/robin-ai/use-robin-prompt-form.ts'
import type { RobinUndoBuffer } from '#fe/pages/make/create-question/robin-ai/use-robin-undo-buffer.ts'

const noUndo: RobinUndoBuffer = {
    hasPrevious: false,
    capture: () => {},
    restore: () => {},
}

const normalizePrompt = (prompt: string) =>
    prompt
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .replace(/[^\p{Letter}\p{Number}\s]/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase()

const wantsMultipleQuestions = (prompt: string): boolean => {
    const words = normalizePrompt(prompt).split(' ').filter(Boolean)
    for (let index = 0; index < words.length - 1; index += 1) {
        const count = Number.parseInt(words[index] ?? '', 10)
        if (!Number.isFinite(count) || count <= 1) continue

        const targetWord = words[index + 1] ?? ''
        if (targetWord.startsWith('question') || targetWord.startsWith('otaz')) {
            return true
        }
    }
    return false
}

const isSaveGeneratedQuestionsPrompt = (prompt: string): boolean => {
    const normalized = normalizePrompt(prompt)
    if (!normalized) return false

    const words = normalized.split(' ')
    const hasSaveVerb = words.some(word => word === 'save' || word === 'store' || word.startsWith('uloz'))
    const hasReferenceTarget = words.some(
        word => word === 'it' || word === 'them' || word === 'to' || word === 'je' || word === 'ich',
    )
    const hasQuestionTarget = words.some(
        word =>
            word === 'question' ||
            word === 'questions' ||
            word === 'draft' ||
            word === 'drafts' ||
            word.startsWith('otazk'),
    )

    return hasSaveVerb && (hasQuestionTarget || hasReferenceTarget)
}

const generateWorkspaceRobinDrafts = async (
    request: RobinGenerateRequest & {
        onQuestionsSaved: () => Promise<void>
    },
): Promise<RobinGenerationResult> => {
    if (request.currentDrafts.length > 0 && isSaveGeneratedQuestionsPrompt(request.question)) {
        await Promise.all(
            request.currentDrafts.map(async draft => {
                await saveQuestion(request.workspaceGuid, questionDraftToRequest(draft))
            }),
        )
        await request.onQuestionsSaved()
        return {
            drafts: [],
            assistantMessage: `Saved ${request.currentDrafts.length} question${request.currentDrafts.length === 1 ? '' : 's'} to workspace.`,
        }
    }

    const aiRequest = {
        question: request.question,
        questionType: request.questionType,
    }
    if (wantsMultipleQuestions(request.question)) {
        return { drafts: await postAiAssistantBatch(request.workspaceGuid, aiRequest) }
    }
    return { drafts: [await postAiAssistant(request.workspaceGuid, aiRequest)] }
}

interface WorkspaceRobinAiHelperProps {
    readonly workspaceId: string
    readonly onQuestionsSaved: () => Promise<void>
}

export const WorkspaceRobinAiHelper = ({ workspaceId, onQuestionsSaved }: WorkspaceRobinAiHelperProps) => {
    const [sheetOpen, setSheetOpen] = useState(false)
    const [questionType, setQuestionType] = useState<QuestionType>('single')

    const handleGenerated = async (_drafts: readonly QuestionDraft[]) => {}

    return createPortal(
        <>
            <RobinFab onOpen={() => setSheetOpen(true)} />
            {sheetOpen && (
                <RobinSheet
                    onGenerated={handleGenerated}
                    generateRequest={request =>
                        generateWorkspaceRobinDrafts({
                            ...request,
                            onQuestionsSaved,
                        })
                    }
                    undo={noUndo}
                    workspaceId={workspaceId}
                    questionType={questionType}
                    onQuestionTypeChange={setQuestionType}
                    onClose={() => setSheetOpen(false)}
                    closeOnGenerated={false}
                    mode="chat"
                />
            )}
        </>,
        document.body,
    )
}
