import type { QuizStatsResponse } from '#fe/model/stats.ts'
import { fetchJson } from '#fe/shared/api/helpers.ts'

export const fetchQuizStats = async (workspaceGuid: string, quizId: string): Promise<QuizStatsResponse> => {
    return await fetchJson<QuizStatsResponse>(`/api/workspaces/${workspaceGuid}/quizzes/${quizId}/stats`)
}
