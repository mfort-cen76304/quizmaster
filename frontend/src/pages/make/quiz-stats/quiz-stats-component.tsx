import { formatDuration } from '#fe/format/duration.ts'
import type { Quiz } from '#model/quiz.ts'
import type { AttemptStatsRecord, QuizStatsResponse, SummaryStats } from '#model/stats.ts'

import { StatsTable } from './stats-table.tsx'
import './quiz-stats-component.scss'

export interface QuizStatsProps {
    readonly quiz: Quiz
    readonly stats: QuizStatsResponse
}

const statusLabels: Record<string, string> = {
    FINISHED: 'Finished',
    IN_PROGRESS: 'In Progress',
    TIMEOUT: 'Timeout',
    ABANDONED: 'Abandoned',
}

const pct = (value: number, total: number): string => {
    const percentage = total > 0 ? Math.round((value / total) * 100) : 0
    return `${value} (${percentage}%)`
}

// Drop the trailing zero so whole point totals stay "2/2" while half points
// render as "1.5/2". Matches what students see on the score page.
const formatPoints = (earned: number): string => (Number.isInteger(earned) ? String(earned) : earned.toFixed(1))

const summaryRow = (s: SummaryStats): string[] => [
    String(s.started),
    String(s.finished),
    String(s.unfinished),
    String(s.timeout),
]

const attemptRow = (a: AttemptStatsRecord): string[] => {
    const earnedPoints = a.correctAnswers + 0.5 * a.partiallyCorrectAnswers
    return [
        a.durationSeconds != null ? formatDuration(a.durationSeconds) : '',
        `${formatPoints(earnedPoints)}/${a.totalQuestions}`,
        pct(a.correctAnswers, a.totalQuestions),
        pct(a.incorrectAnswers, a.totalQuestions),
        String(a.score),
        statusLabels[a.status] ?? a.status,
        pct(a.partiallyCorrectAnswers, a.totalQuestions),
    ]
}

export const QuizStats = ({ quiz, stats }: QuizStatsProps) => (
    <div className="quiz-stats">
        <h2>Statistics for quiz: {quiz.title}</h2>
        <StatsTable
            testId="summary-stats-table"
            caption="Summary"
            columns={['Started', 'Finished', 'Unfinished', 'Timeout']}
            rows={[summaryRow(stats.summary)]}
        />
        <StatsTable
            testId="attempt-stats-table"
            caption="Attempts"
            columns={[
                'Duration',
                'Points',
                'Correct Answers',
                'Incorrect Answers',
                'Score',
                'Status',
                'Partially Correct Answers',
            ]}
            rows={stats.attempts.map(attemptRow)}
        />
    </div>
)
