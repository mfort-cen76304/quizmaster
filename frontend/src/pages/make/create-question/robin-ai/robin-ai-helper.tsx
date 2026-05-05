import { useState } from 'react'
import { createPortal } from 'react-dom'

import type { QuestionDraft, QuestionType } from '#model/question.ts'
import './robin-ai.scss'
import { questionToPatch } from './question-draft-mappers.ts'
import { RobinFab } from './robin-fab.tsx'
import { RobinSheet } from './robin-sheet.tsx'
import type { RobinFormBinding } from './use-robin-prompt-form.ts'
import { useRobinUndoBuffer } from './use-robin-undo-buffer.ts'

interface RobinAiHelperProps {
    readonly form: RobinFormBinding
}

export const RobinAiHelper = ({ form }: RobinAiHelperProps) => {
    const [sheetOpen, setSheetOpen] = useState(false)
    const [questionType, setQuestionType] = useState<QuestionType>('single')
    const undo = useRobinUndoBuffer(form)
    const handleGenerated = (drafts: readonly QuestionDraft[]) => {
        const [draft] = drafts
        if (!draft) return
        form.applyPatch(questionToPatch(draft))
    }

    return createPortal(
        <>
            <RobinFab onOpen={() => setSheetOpen(true)} />
            {sheetOpen && (
                <RobinSheet
                    onGenerated={handleGenerated}
                    undo={undo}
                    questionType={questionType}
                    onQuestionTypeChange={setQuestionType}
                    onClose={() => setSheetOpen(false)}
                />
            )}
        </>,
        document.body,
    )
}
