import type { Quiz } from '#model/quiz.ts'

import { QuestionFeedback } from './components/question.tsx'
import type { QuizAnswers } from './quiz-answers-state.ts'
import { evaluate } from './quiz-score.ts'

interface QuizScorePageProps {
    readonly quiz: Quiz
    readonly quizAnswers: QuizAnswers
}

export const QuizScorePage = ({ quiz, quizAnswers }: QuizScorePageProps) => {
    const evaluation = evaluate(quiz, quizAnswers)
    const { total, score } = evaluation

    const percentage = (score / total) * 100
    const passed = percentage >= quiz.passScore
    const result = passed ? 'passed' : 'failed'

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

            <h2>Answer overview</h2>
            {quiz.questions.map((question, idx) => {
                const answer = quizAnswers.finalAnswers[idx]
                const selectedIdxs = answer?.type === 'choice' ? answer.selectedIdxs : undefined
                return <QuestionFeedback key={question.id} question={question} selectedAnswerIdxs={selectedIdxs} />
            })}
        </>
    )
}
