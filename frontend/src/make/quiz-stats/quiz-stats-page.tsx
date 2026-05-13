import { useCallback, useState } from 'react'
import { useParams } from 'react-router'

import { fetchWorkspaceQuiz } from '#fe/make/api/quiz.ts'
import { fetchQuizStats } from '#fe/make/api/stats.ts'
import type { QuizStatsResponse } from '#fe/make/model/stats.ts'
import { useApi } from '#fe/shared/api/hooks.ts'
import type { Quiz } from '#fe/shared/model/quiz.ts'
import { Page } from '#fe/shared/page.tsx'
import { urls } from '#fe/urls.ts'

import { QuizStats } from './quiz-stats-component.tsx'
export const QuizStatsPage = () => {
    const params = useParams()
    const workspaceId = params.workspaceId ?? ''
    const [quiz, setQuiz] = useState<Quiz>()
    const [stats, setStats] = useState<QuizStatsResponse>()
    const fetchStats = useCallback((quizId: string) => fetchQuizStats(workspaceId, quizId), [workspaceId])
    useApi(params.id, id => fetchWorkspaceQuiz(workspaceId, id), setQuiz)
    useApi(params.id, fetchStats, setStats)
    return quiz && stats ? (
        <Page
            id="quiz-stats-page"
            title="Quiz statistics"
            subtitle={`See completion, pacing, and question-level performance for "${quiz.title}".`}
            back={{ to: urls.workspace(workspaceId), label: 'Back to workspace' }}
        >
            <QuizStats quiz={quiz} stats={stats} />
        </Page>
    ) : null
}
