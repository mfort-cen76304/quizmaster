import type { AnswerIdxs, QuestionType } from './enums.ts'

export interface QuestionRequest {
    readonly question: string
    readonly answers: readonly string[]
    readonly correctAnswers: readonly number[]
    readonly explanations: readonly string[]
    readonly questionExplanation: string
    readonly questionType: QuestionType
    readonly isEasy: boolean
    readonly imageUrl?: string
    readonly tolerance?: number
    readonly tags: readonly string[]
}

export interface Question {
    readonly id: number
    readonly question: string
    readonly imageUrl?: string
    readonly tolerance?: number
    readonly answers: string[]
    readonly explanations: string[]
    readonly questionExplanation: string
    readonly correctAnswers: AnswerIdxs
    readonly questionType: QuestionType
    workspaceGuid: string | null
    isEasy: boolean
    readonly tags: string[]
}

export type QuestionDraft = Omit<Question, 'id' | 'workspaceGuid'>
