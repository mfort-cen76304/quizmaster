import './correctness.css'

interface CorrectnessProps {
    readonly score: number
    readonly errorCount: number
}

export const Correctness = (props: CorrectnessProps) => {
    const label = props.score === 1 ? 'Correct!' : 'Incorrect!'
    const className = props.score === 1 ? 'correct' : 'incorrect'
    return <span className={`feedback ${className}`}>{label}</span>
}

export const QuestionCorrectness = (props: CorrectnessProps) => (
    <p className="question-feedback">
        <Correctness {...props} />
    </p>
)
