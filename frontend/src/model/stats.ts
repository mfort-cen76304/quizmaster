export enum AttemptStatus {
    FINISHED = 'FINISHED',
    IN_PROGRESS = 'IN_PROGRESS',
    TIMEOUT = 'TIMEOUT',
}

export interface StatsRecord {
    readonly id: number
    readonly quizId: number
    readonly durationSeconds: number
    readonly points: number
    readonly score: number
    readonly status: AttemptStatus
    readonly maxScore: number
    readonly startedAt: string
    readonly finishedAt: string | null
}

export interface AttemptRequest {
    readonly quizId: number
    readonly durationSeconds: number
    readonly points: number
    readonly score: number
    readonly status: AttemptStatus
    readonly maxScore: number
    readonly startedAt: string
    readonly finishedAt: string | null
}

export interface AttemptPatchRequest {
    readonly correctAnswers?: number
    readonly incorrectAnswers?: number
}

export type Stats = readonly StatsRecord[]
