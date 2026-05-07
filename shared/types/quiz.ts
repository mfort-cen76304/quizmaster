import type { Difficulty, QuizMode } from './enums.ts'
import type { Question, QuestionTake } from './question.ts'

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

export interface QuizTake {
    readonly id: number
    readonly title: string
    readonly description: string
    readonly startAt: string | null
    readonly endAt: string | null
    readonly questions: readonly QuestionTake[]
    readonly mode: QuizMode
    readonly difficulty: Difficulty
    readonly passScore: number
    readonly timeLimit: number
    readonly randomQuestionCount?: number
}

export interface QuizMetadata {
    readonly id: number
    readonly title: string
    readonly description: string
    readonly startAt: string | null
    readonly endAt: string | null
    readonly mode: QuizMode
    readonly difficulty: Difficulty
    readonly passScore: number
    readonly timeLimit: number
    readonly randomQuestionCount?: number
    readonly questionCount: number
}

export type QuizSubmittedAnswer =
    | { readonly questionId: number; readonly type: 'choice'; readonly selectedIdxs: readonly number[] }
    | { readonly questionId: number; readonly type: 'numerical'; readonly value: number }

export interface QuizEvaluationRequest {
    readonly questionIds: readonly number[]
    readonly answers: readonly QuizSubmittedAnswer[]
    readonly finishedAt: string
    readonly timedOutAt?: string
}

export interface QuizEvaluationResponse {
    readonly attempt: {
        readonly id: number
        readonly quizId: number
        readonly correctAnswers: number
        readonly incorrectAnswers: number
        readonly partiallyCorrectAnswers: number
    }
    readonly score: number
    readonly totalQuestions: number
    readonly questions?: readonly Question[]
}
