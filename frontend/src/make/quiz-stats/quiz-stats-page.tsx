import { useCallback, useState } from 'react'
import { useParams } from 'react-router'

import { fetchWorkspaceQuiz } from '#fe/make/api/quiz.ts'
import { fetchQuizStats } from '#fe/make/api/stats.ts'
import type { QuizStatsResponse } from '#fe/make/model/stats.ts'
import { useApi } from '#fe/shared/api/hooks.ts'
import type { Quiz } from '#fe/shared/model/quiz.ts'

import { QuizStats } from './quiz-stats-component.tsx'

export const QuizStatsPage = () => {
    const params = useParams()
    const [quiz, setQuiz] = useState<Quiz>()
    const [stats, setStats] = useState<QuizStatsResponse>()

    const fetchStats = useCallback(
        (quizId: string) => fetchQuizStats(params.workspaceId!, quizId),
        [params.workspaceId],
    )

    useApi(params.id, id => fetchWorkspaceQuiz(params.workspaceId!, id), setQuiz)
    useApi(params.id, fetchStats, setStats)

    return quiz && stats && <QuizStats quiz={quiz} stats={stats} />
}
