import type { Difficulty, QuizMode } from './enums.ts'
import type { Question } from './question.ts'

export interface QuizRequest {
    readonly title: string
    readonly description: string
    readonly startAt: string | null
    readonly endAt: string | null
    readonly questionIds: readonly number[]
    readonly mode: QuizMode
    readonly difficulty: Difficulty
    readonly passScore: number
    readonly timeLimit: number
    readonly workspaceGuid: string | null
    readonly randomQuestionCount?: number
}

export interface Quiz {
    readonly id: number
    readonly title: string
    readonly description: string
    readonly startAt: string | null
    readonly endAt: string | null
    readonly questions: readonly Question[]
    readonly mode: QuizMode
    readonly difficulty: Difficulty
    readonly passScore: number
    readonly timeLimit: number
    readonly randomQuestionCount?: number
}
