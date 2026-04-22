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

const summaryRow = (s: SummaryStats): string[] => [
    String(s.started),
    String(s.finished),
    String(s.unfinished),
    String(s.timeout),
]

const attemptRow = (a: AttemptStatsRecord): string[] => [
    a.durationSeconds != null ? formatDuration(a.durationSeconds) : '',
    `${a.correctAnswers}/${a.totalQuestions}`,
    pct(a.correctAnswers, a.totalQuestions),
    pct(a.incorrectAnswers, a.totalQuestions),
    String(a.score),
    statusLabels[a.status] ?? a.status,
]

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
                'Partially Correct answers',
            ]}
            rows={stats.attempts.map(attemptRow)}
        />
    </div>
)
