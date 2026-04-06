import type { Stats, StatsRecord, AttemptRequest } from '#model/stats.ts'

import { fetchJson, postJson, putJson } from './helpers.ts'

export const fetchStats = async (quizId: string): Promise<Stats> => {
    return await fetchJson<Stats>(`/api/attempt/quiz/${quizId}`)
}

export const createAttempt = async (request: AttemptRequest): Promise<StatsRecord> => {
    return await postJson<AttemptRequest, StatsRecord>('/api/attempt', request)
}

export const updateAttempt = async (id: number, request: AttemptRequest): Promise<StatsRecord> => {
    return await putJson<AttemptRequest, StatsRecord>(`/api/attempt/${id}`, request)
}
