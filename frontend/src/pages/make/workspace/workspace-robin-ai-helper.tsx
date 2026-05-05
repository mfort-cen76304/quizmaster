import { useState } from 'react'
import { createPortal } from 'react-dom'

import { postAiAssistant, postAiAssistantBatch } from '#api/ai-assistant.ts'
import { saveQuestion } from '#api/question.ts'
import type { QuestionDraft, QuestionType } from '#model/question.ts'
import { RobinFab } from '#pages/make/create-question/robin-ai/robin-fab.tsx'
import { questionDraftToRequest } from '#pages/make/create-question/robin-ai/question-draft-mappers.ts'
import { RobinSheet } from '#pages/make/create-question/robin-ai/robin-sheet.tsx'
import type { RobinGenerationResult } from '#pages/make/create-question/robin-ai/use-robin-prompt-form.ts'
import type { RobinUndoBuffer } from '#pages/make/create-question/robin-ai/use-robin-undo-buffer.ts'

const noUndo: RobinUndoBuffer = {
    hasPrevious: false,
    capture: () => {},
    restore: () => {},
}

const normalizePrompt = (prompt: string) =>
    prompt
        .normalize('NFD')
        .replaceAll(/\p{Diacritic}/gu, '')
        .replaceAll(/[^\p{Letter}\p{Number}\s]/gu, ' ')
        .replaceAll(/\s+/g, ' ')
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
    const hasReferenceTarget = words.some(word => word === 'it' || word === 'them' || word === 'to' || word === 'je' || word === 'ich')
    const hasQuestionTarget = words.some(
        word => word === 'question' || word === 'questions' || word === 'draft' || word === 'drafts' || word.startsWith('otazk'),
    )

    return hasSaveVerb && (hasQuestionTarget || hasReferenceTarget)
}

const generateWorkspaceRobinDrafts = async (request: {
    question: string
    questionType: QuestionType
    workspaceGuid?: string
    currentDrafts: readonly QuestionDraft[]
    onQuestionsSaved: () => Promise<void>
}): Promise<RobinGenerationResult> => {
    if (request.currentDrafts.length > 0 && isSaveGeneratedQuestionsPrompt(request.question)) {
        await Promise.all(
            request.currentDrafts.map(async draft => {
                await saveQuestion(request.workspaceGuid ?? '', questionDraftToRequest(draft))
            }),
        )
        await request.onQuestionsSaved()
        return {
            drafts: [],
            assistantMessage: `Saved ${request.currentDrafts.length} question${request.currentDrafts.length === 1 ? '' : 's'} to workspace.`,
        }
    }

    if (wantsMultipleQuestions(request.question)) {
        return { drafts: await postAiAssistantBatch(request) }
    }
    return { drafts: [await postAiAssistant(request)] }
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
                    questionType={questionType}
                    workspaceGuid={workspaceId}
                    onQuestionTypeChange={setQuestionType}
                    onClose={() => setSheetOpen(false)}
                    closeOnGenerated={false}
                />
            )}
        </>,
        document.body,
    )
}
