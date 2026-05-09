import { useState } from 'react'

import type { QuestionFormStatePatch } from '../form/question-form-state.ts'
import type { RobinFormBinding } from './use-robin-prompt-form.ts'

export interface RobinUndoBuffer {
    readonly hasPrevious: boolean
    readonly capture: () => void
    readonly restore: () => void
}

export const useRobinUndoBuffer = (form: RobinFormBinding): RobinUndoBuffer => {
    const [previousSnapshot, setPreviousSnapshot] = useState<QuestionFormStatePatch | null>(null)

    return {
        hasPrevious: previousSnapshot !== null,
        capture: () => setPreviousSnapshot(form.snapshot()),
        restore: () => {
            if (!previousSnapshot) return
            form.applyPatch(previousSnapshot)
            setPreviousSnapshot(null)
        },
    }
}
