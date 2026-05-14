import './numerical-result.scss'
import { type Question, evaluateAnswer, numericalAnswer } from '#fe/take/model/question.ts'

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
    const isCorrect = result.status === 'CORRECT'
    const isExact = userValue === correctValue

    if (isCorrect && isExact) {
        return (
            <div className="numerical-result">
                <div className="numerical-bar correct" data-testid="correct-bar">
                    <span className="bar-label correct-label">Correct answer:</span> {correctAnswer}
                </div>
            </div>
        )
    }

    const userBarClass = isCorrect ? 'within-tolerance' : 'incorrect'

    return (
        <div className="numerical-result">
            <div className="numerical-bar correct" data-testid="correct-bar">
                <span className="bar-label correct-label">Correct answer:</span> {correctAnswer}
                {!isCorrect && <span className="bar-note"> (missed)</span>}
            </div>
            <div className={`numerical-bar ${userBarClass}`} data-testid="user-bar">
                <span className="bar-label">Your answer:</span> {userValue}
                {isCorrect && <span className="bar-note"> (within tolerance)</span>}
            </div>
        </div>
    )
}
