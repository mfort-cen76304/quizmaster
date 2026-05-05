import './quiz-play.scss'
import './quiz-score-page.scss'
import type { Quiz, QuizSubmitResponse, QuizTake } from '#model/quiz.ts'

import { QuestionSummary } from './components/question-summary.tsx'
import type { QuizAnswers } from './quiz-answers-state.ts'
import { evaluate } from './quiz-score.ts'

interface QuizScorePageProps {
    readonly quiz: Quiz | QuizTake
    readonly quizAnswers?: QuizAnswers
    readonly result?: Pick<QuizSubmitResponse, 'score' | 'totalQuestions' | 'questions'>
}

const canShowAnswerOverview = (quiz: Quiz | QuizTake): quiz is Quiz =>
    quiz.questions.every(question => 'correctAnswers' in question)

export const QuizScorePage = ({ quiz, quizAnswers, result }: QuizScorePageProps) => {
    const reviewQuiz = result?.questions ? { ...quiz, questions: result.questions } : quiz
    const evaluation = quizAnswers && canShowAnswerOverview(reviewQuiz) ? evaluate(reviewQuiz, quizAnswers) : undefined
    const total = result?.totalQuestions ?? evaluation?.total ?? reviewQuiz.questions.length
    const score = result?.score ?? evaluation?.score ?? 0
    const answerOverview =
        quizAnswers && canShowAnswerOverview(reviewQuiz) ? (
            <>
                <h2>Answer overview</h2>
                {reviewQuiz.questions.map((question, idx) => {
                    const answer = quizAnswers.finalAnswers[idx]
                    return <QuestionSummary key={question.id} question={question} answer={answer} />
                })}
            </>
        ) : null

    const percentage = (score / total) * 100
    const passed = percentage >= quiz.passScore
    const outcome = passed ? 'passed' : 'failed'

    return (
        <div className="quiz-take">
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
                        <span id="text-result">{outcome}</span>
                    </div>
                </div>
            </div>

            {answerOverview}
        </div>
    )
}
