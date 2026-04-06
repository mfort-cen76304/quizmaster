import type { Quiz } from '#model/quiz.ts'
import type { Stats } from '#model/stats.ts'
import './quiz-stats-component.scss'

export interface QuizStatsProps {
    readonly quiz: Quiz
    readonly stats: Stats
}

interface SummaryStats {
    readonly started: number
    readonly finished: number
    readonly timedOut: number
}

const formatDuration = (durationSeconds: number): string => {
    if (durationSeconds < 60) {
        return `${durationSeconds} second${durationSeconds !== 1 ? 's' : ''}`
    }

    const minutes = Math.floor(durationSeconds / 60)
    const seconds = durationSeconds % 60

    if (minutes < 60) {
        if (seconds === 0) {
            return `${minutes} minute${minutes !== 1 ? 's' : ''}`
        }
        return `${minutes} minute${minutes !== 1 ? 's' : ''} ${seconds} second${seconds !== 1 ? 's' : ''}`
    }

    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60

    if (remainingMinutes === 0 && seconds === 0) {
        return `${hours} hour${hours !== 1 ? 's' : ''}`
    }
    if (seconds === 0) {
        return `${hours} hour${hours !== 1 ? 's' : ''} ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`
    }
    if (remainingMinutes === 0) {
        return `${hours} hour${hours !== 1 ? 's' : ''} ${seconds} second${seconds !== 1 ? 's' : ''}`
    }
    return `${hours} hour${hours !== 1 ? 's' : ''} ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''} ${seconds} second${seconds !== 1 ? 's' : ''}`
}

export const QuizStats = ({ quiz, stats }: QuizStatsProps) => {
    const timedOutCount = stats.filter(stat => stat.status === 'TIMEOUT').length

    const summary: SummaryStats = {
        started: stats.length,
        finished: stats.filter(stat => stat.status === 'FINISHED').length,
        timedOut: timedOutCount,
    }

    return (
        <div className="quiz-stats">
            <h2>Statistics for quiz: {quiz.title}</h2>
            <table data-testid="summary-stats-table">
                <caption>Summary</caption>
                <thead>
                    <tr>
                        <th>Started</th>
                        <th>Finished</th>
                        <th>Timeout</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>{summary.started}</td>
                        <td>{summary.finished}</td>
                        <td>{summary.timedOut}</td>
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
                    {stats.map(stat => (
                        <tr key={stat.id}>
                            {(() => {
                                const points = stat.points
                                const incorrectPoints = Math.max(stat.maxScore - points, 0)
                                const formatPoints = (value: number): string => {
                                    // Round to 1 decimal place and check if it's a whole number
                                    const rounded = Math.round(value * 10) / 10
                                    return rounded % 1 === 0 ? rounded.toString() : rounded.toFixed(1)
                                }
                                const formatPointsWithPercentage = (value: number, total: number): string => {
                                    const percentage = total > 0 ? Math.round((value / total) * 100) : 0
                                    return `${formatPoints(value)} (${percentage}%)`
                                }
                                const formatStatus = (status: string): string => {
                                    // Capitalize first letter and make rest lowercase
                                    return status.charAt(0) + status.slice(1).toLowerCase().replace('_', ' ')
                                }

                                return (
                                    <>
                                        <td>{formatDuration(stat.durationSeconds)}</td>
                                        <td>{`${formatPoints(points)}/${stat.maxScore}`}</td>
                                        <td>{formatPointsWithPercentage(points, stat.maxScore)}</td>
                                        <td>{formatPointsWithPercentage(incorrectPoints, stat.maxScore)}</td>
                                        <td>{stat.score}</td>
                                        <td>{formatStatus(stat.status)}</td>
                                    </>
                                )
                            })()}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
