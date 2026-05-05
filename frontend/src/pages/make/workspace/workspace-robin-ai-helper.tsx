import { useState } from 'react'
import { createPortal } from 'react-dom'

import { postAiAssistant, postAiAssistantBatch } from '#api/ai-assistant.ts'
import { saveQuestion } from '#api/question.ts'
import type { QuestionDraft, QuestionType } from '#model/question.ts'
import { questionDraftToRequest } from '#pages/make/create-question/robin-ai/question-draft-mappers.ts'
import { RobinFab } from '#pages/make/create-question/robin-ai/robin-fab.tsx'
import { RobinSheet } from '#pages/make/create-question/robin-ai/robin-sheet.tsx'
import type { RobinUndoBuffer } from '#pages/make/create-question/robin-ai/use-robin-undo-buffer.ts'

const noUndo: RobinUndoBuffer = {
    hasPrevious: false,
    capture: () => {},
    restore: () => {},
}

const wantsMultipleQuestions = (prompt: string): boolean => {
    const match = prompt.match(/\b(\d+)\s+(questions?|ot[aá]zk\w*)\b/iu)
    if (!match) return false
    return Number.parseInt(match[1] ?? '0', 10) > 1
}

const generateWorkspaceRobinDrafts = async (request: {
    question: string
    questionType: QuestionType
    workspaceGuid?: string
}): Promise<readonly QuestionDraft[]> => {
    if (wantsMultipleQuestions(request.question)) {
        return await postAiAssistantBatch(request)
    }
    return [await postAiAssistant(request)]
}

interface WorkspaceRobinAiHelperProps {
    readonly workspaceId: string
    readonly onQuestionCreated: () => Promise<void>
}

export const WorkspaceRobinAiHelper = ({ workspaceId, onQuestionCreated }: WorkspaceRobinAiHelperProps) => {
    const [sheetOpen, setSheetOpen] = useState(false)
    const [questionType, setQuestionType] = useState<QuestionType>('single')

    const handleGenerated = async (drafts: readonly QuestionDraft[]) => {
        for (const draft of drafts) {
            await saveQuestion(workspaceId, questionDraftToRequest(draft))
        }
        await onQuestionCreated()
    }

    return createPortal(
        <>
            <RobinFab onOpen={() => setSheetOpen(true)} />
            {sheetOpen && (
                <RobinSheet
                    onGenerated={handleGenerated}
                    generateRequest={generateWorkspaceRobinDrafts}
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
