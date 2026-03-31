import type { Quiz } from 'model/quiz.ts'
import { isAnsweredCorrectly } from 'model/question.ts'
import { Button } from 'pages/components/button'
import { QuestionFeedback } from './components/question'
import type { QuizAnswers } from './quiz-answers-state.ts'
import { evaluate } from './quiz-score.ts'

interface QuizScorePageProps {
    readonly quiz: Quiz
    readonly quizAnswers: QuizAnswers
    readonly onRetakeIncorrect?: (incorrectQuestionIds: number[]) => void
}

export const QuizScorePage = ({ quiz, quizAnswers, onRetakeIncorrect }: QuizScorePageProps) => {
    const evaluation = evaluate(quiz, quizAnswers)
    const { total, score } = evaluation

    const percentage = (score / total) * 100
    const passed = percentage >= quiz.passScore
    const result = passed ? 'passed' : 'failed'

    const incorrectQuestionIds = quiz.questions
        .filter((question, idx) => !isAnsweredCorrectly(quizAnswers.finalAnswers[idx], question.correctAnswers))
        .map(q => q.id)

    return (
        <>
            <h1>Test result</h1>
            <div className="resultTable" id="results">
                <div className="row header">
                    <div>Points</div>
                    <div>Score</div>
                    <div>Min pass score</div>
                    <div>State</div>
                </div>
                <div className="row">
                    <div>
                        <span id="correct-answers">{score}</span> / <span id="total-questions">{total}</span>
                    </div>
                    <div>
                        <span id="percentage-result">{percentage.toFixed(0)}</span> %
                    </div>
                    <div>
                        <span id="pass-score">{quiz.passScore}</span> %
                    </div>
                    <div>
                        <span id="text-result">{result}</span>
                    </div>
                </div>
            </div>

            {onRetakeIncorrect && incorrectQuestionIds.length > 0 && (
                <Button id="retake-incorrect" onClick={() => onRetakeIncorrect(incorrectQuestionIds)}>
                    Retake incorrect questions
                </Button>
            )}

            <h2>Answer overview</h2>
            {quiz.questions.map((question, idx) => (
                <QuestionFeedback
                    key={question.id}
                    question={question}
                    selectedAnswerIdxs={quizAnswers.finalAnswers[idx]}
                />
            ))}
        </>
    )
}
