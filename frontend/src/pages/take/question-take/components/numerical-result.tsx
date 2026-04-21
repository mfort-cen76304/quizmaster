import './numerical-result.scss'
import { type Question, evaluateAnswer, numericalAnswer } from '#model/question.ts'

interface NumericalResultProps {
    readonly question: Question
    readonly userInput: string
}

export const NumericalResult = ({ question, userInput }: NumericalResultProps) => {
    const correctAnswer = question.answers[0]
    const answer = numericalAnswer(userInput)
    if (!answer || answer.type !== 'numerical') return null

    const userValue = answer.value
    const correctValue = Number.parseFloat(correctAnswer)
    const result = evaluateAnswer(question, answer)
    const isExact = userValue === correctValue

    if (result.correct && isExact) {
        return (
            <div className="numerical-result">
                <div className="numerical-bar correct" data-testid="correct-bar">
                    <span className="bar-label">Correct answer:</span> {correctAnswer}
                </div>
            </div>
        )
    }

    const userBarClass = result.correct ? 'within-tolerance' : 'incorrect'

    return (
        <div className="numerical-result">
            <div className="numerical-bar correct" data-testid="correct-bar">
                <span className="bar-label">Correct answer:</span> {correctAnswer}
            </div>
            <div className={`numerical-bar ${userBarClass}`} data-testid="user-bar">
                <span className="bar-label">Your answer:</span> {userValue}
                {result.correct && <span className="bar-note"> (within tolerance)</span>}
            </div>
        </div>
    )
}
