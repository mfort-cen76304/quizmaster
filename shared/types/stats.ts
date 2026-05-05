export interface AttemptStatsRecord {
    readonly id: number
    readonly durationSeconds: number | null
    readonly correctAnswers: number
    readonly incorrectAnswers: number
    readonly partiallyCorrectAnswers: number
    readonly totalQuestions: number
    readonly score: number
    readonly status: string
}

export interface SummaryStats {
    readonly started: number
    readonly finished: number
    readonly unfinished: number
    readonly timeout: number
}

export interface QuizStatsResponse {
    readonly summary: SummaryStats
    readonly attempts: readonly AttemptStatsRecord[]
}
