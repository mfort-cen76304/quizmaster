export type { AttemptStatsRecord, QuizStatsResponse, SummaryStats } from '#shared/types/stats.ts'

export interface AttemptRequest {
    readonly quizId: number
    readonly startedAt: string
}

export interface AttemptResponse {
    readonly id: number
}
