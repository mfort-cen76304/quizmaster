import { formatDuration } from '#fe/format/duration.ts'
import type { Quiz } from '#model/quiz.ts'
import type { AttemptStatsRecord, QuizStatsResponse } from '#model/stats.ts'
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

const formatStatus = (status: string): string => statusLabels[status] ?? status

const formatWithPercentage = (value: number, total: number): string => {
    const percentage = total > 0 ? Math.round((value / total) * 100) : 0
    return `${value} (${percentage}%)`
}

export const QuizStats = ({ quiz, stats }: QuizStatsProps) => {
    const { summary, attempts } = stats

    return (
        <div className="quiz-stats">
            <h2>Statistics for quiz: {quiz.title}</h2>
            <table data-testid="summary-stats-table">
                <caption>Summary</caption>
                <thead>
                    <tr>
                        <th>Started</th>
                        <th>Finished</th>
                        <th>Unfinished</th>
                        <th>Timeout</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>{summary.started}</td>
                        <td>{summary.finished}</td>
                        <td>{summary.unfinished}</td>
                        <td>{summary.timeout}</td>
                    </tr>
                </tbody>
            </table>
            <table data-testid="attempt-stats-table">
                <caption>Attempts</caption>
                <thead>
                    <tr>
                        <th>Duration</th>
                        <th>Points</th>
                        <th>Correct Answers</th>
                        <th>Incorrect Answers</th>
                        <th>Score</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {attempts.map((attempt: AttemptStatsRecord) => (
                        <tr key={attempt.id}>
                            <td>{attempt.durationSeconds != null ? formatDuration(attempt.durationSeconds) : ''}</td>
                            <td>{`${attempt.correctAnswers}/${attempt.totalQuestions}`}</td>
                            <td>{formatWithPercentage(attempt.correctAnswers, attempt.totalQuestions)}</td>
                            <td>{formatWithPercentage(attempt.incorrectAnswers, attempt.totalQuestions)}</td>
                            <td>{attempt.score}</td>
                            <td>{formatStatus(attempt.status)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
