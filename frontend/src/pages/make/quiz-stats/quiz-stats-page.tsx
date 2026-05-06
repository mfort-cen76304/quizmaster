import { useCallback, useState } from 'react'
import { useParams } from 'react-router'

import { useApi } from '#api/hooks.ts'
import { fetchWorkspaceQuiz } from '#api/quiz.ts'
import { fetchQuizStats } from '#api/stats.ts'
import type { Quiz } from '#model/quiz.ts'
import type { QuizStatsResponse } from '#model/stats.ts'

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
