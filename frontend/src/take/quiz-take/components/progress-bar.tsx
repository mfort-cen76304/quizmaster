import './progress-bar.scss'

interface ProgressBarProps {
    readonly current: number
    readonly total: number
}

export const ProgressBar = ({ current, total }: ProgressBarProps) => {
    const percent = total > 0 ? Math.round((current / total) * 100) : 0
    return (
        <div className="quiz-progress">
            <div className="meta">
                <span className="position">
                    Question {current} of {total}
                </span>
                <span className="percent">{percent}%</span>
            </div>
            <progress id="progress-bar" value={current} max={total} />
        </div>
    )
}
