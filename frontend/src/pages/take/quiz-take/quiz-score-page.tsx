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
        <div className="page quiz-score" id="quiz-score">
            <h1>Quiz result</h1>

            <section className="score-summary" id="results" data-result={outcome}>
                <header>
                    <span className={`outcome ${outcome}`}>
                        <span id="text-result">{outcome}</span>
                    </span>
                    <div className="percent-display">
                        <span className="percent-value">
                            <span id="percentage-result">{percentage.toFixed(0)}</span>%
                        </span>
                        <span className="percent-label">your score</span>
                    </div>
                </header>
                <dl className="metrics">
                    <div className="metric">
                        <dt>Points</dt>
                        <dd>
                            <span id="correct-answers">{score}</span>
                            <span className="separator"> / </span>
                            <span id="total-questions">{total}</span>
                        </dd>
                    </div>
                    <div className="metric">
                        <dt>Required to pass</dt>
                        <dd>
                            <span id="pass-score">{quiz.passScore}</span>%
                        </dd>
                    </div>
                </dl>
            </section>

            {answerOverview}
        </div>
    )
}
