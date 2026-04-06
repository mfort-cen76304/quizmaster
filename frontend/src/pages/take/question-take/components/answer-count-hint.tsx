interface AnswerCountHintProps {
    readonly count: number
}

export const AnswerCountHint = ({ count }: AnswerCountHintProps) => (
    <div>
        Correct answers count is <strong className="correct-answers-count">{count}</strong>
    </div>
)
