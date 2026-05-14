import './correctness.scss'
import type { AnswerStatus } from '#fe/take/model/question.ts'

interface CorrectnessProps {
    readonly status: AnswerStatus
}

const LABELS: Record<AnswerStatus, { label: string; className: string }> = {
    CORRECT: { label: 'Correct!', className: 'correct' },
    PARTIAL: { label: 'Partially correct!', className: 'partial-correct' },
    INCORRECT: { label: 'Incorrect!', className: 'incorrect' },
    UNANSWERED: { label: 'Incorrect!', className: 'incorrect' },
}

export const Correctness = ({ status }: CorrectnessProps) => {
    const { label, className } = LABELS[status]
    return <span className={`feedback ${className}`}>{label}</span>
}

export const QuestionCorrectness = (props: CorrectnessProps) => (
    <p className="question-feedback">
        <Correctness {...props} />
    </p>
)
