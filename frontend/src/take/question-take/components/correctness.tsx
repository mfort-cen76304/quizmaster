import './correctness.scss'

interface CorrectnessProps {
    readonly score: number
}

export const Correctness = (props: CorrectnessProps) => {
    let label: string
    let className: string
    if (props.score > 0 && props.score < 1) {
        label = 'Partially correct!'
        className = 'partial-correct'
    } else {
        label = props.score === 1 ? 'Correct!' : 'Incorrect!'
        className = props.score === 1 ? 'correct' : 'incorrect'
    }
    return <span className={`feedback ${className}`}>{label}</span>
}

export const QuestionCorrectness = (props: CorrectnessProps) => (
    <p className="question-feedback">
        <Correctness {...props} />
    </p>
)
