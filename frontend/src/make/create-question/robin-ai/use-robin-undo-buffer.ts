import { useState } from 'react'

import type { QuestionFormStatePatch } from '../form/question-form-state.ts'
import type { RobinFormBinding } from './use-robin-prompt-form.ts'

export interface RobinUndoBuffer {
    readonly hasPrevious: boolean
    readonly capture: () => void
    readonly restore: () => void
}

export const useRobinUndoBuffer = (form: RobinFormBinding): RobinUndoBuffer => {
    const [stack, setStack] = useState<QuestionFormStatePatch[]>([])

    return {
        hasPrevious: stack.length > 0,
        capture: () => {
            const snapshot = form.snapshot()
            setStack(s => [...s, snapshot])
        },
        restore: () => {
            if (stack.length === 0) return
            form.applyPatch(stack[stack.length - 1])
            setStack(s => s.slice(0, -1))
        },
    }
}
