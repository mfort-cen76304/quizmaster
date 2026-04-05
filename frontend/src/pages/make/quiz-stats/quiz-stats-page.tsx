import { useState } from 'react'
import { useParams } from 'react-router'

import type { Quiz } from '#fe/model/quiz.ts'
import { useApi } from '#fe/api/hooks.ts'
import { fetchQuiz } from '#fe/api/quiz.ts'
import { QuizStats } from './quiz-stats-component.tsx'
import type { Stats } from '#fe/model/stats.ts'
import { fetchStats } from '#fe/api/stats.ts'

export const QuizStatsPage = () => {
    const params = useParams()
    const [quiz, setQuiz] = useState<Quiz>()
    const [stats, setStats] = useState<Stats>()

    useApi(params.id, fetchQuiz, setQuiz)
    useApi(params.id, fetchStats, setStats)

    return quiz && stats && <QuizStats quiz={quiz} stats={stats} />
}
