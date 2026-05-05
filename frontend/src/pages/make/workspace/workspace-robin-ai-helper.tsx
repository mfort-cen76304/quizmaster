import { useState } from 'react'
import { createPortal } from 'react-dom'

import { postAiAssistantBatch } from '#api/ai-assistant.ts'
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
                    generateRequest={postAiAssistantBatch}
                    undo={noUndo}
                    questionType={questionType}
                    onQuestionTypeChange={setQuestionType}
                    onClose={() => setSheetOpen(false)}
                />
            )}
        </>,
        document.body,
    )
}
