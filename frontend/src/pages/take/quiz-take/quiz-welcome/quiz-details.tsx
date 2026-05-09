import type { QuizMetadata } from '#fe/model/quiz.ts'
import { Page } from '#fe/pages/components'
import { StartButton } from '#fe/pages/take/quiz-take/components/buttons.tsx'
import { TakeCard } from '#fe/pages/take/shared/take-card.tsx'

type QuizDisplayFields = Pick<QuizMetadata, 'title' | 'description' | 'timeLimit' | 'passScore' | 'mode'>

export interface QuizDetailsProps {
    readonly quiz: QuizDisplayFields
    readonly questionCount: number
    readonly canStart: boolean
    readonly onStart: () => void
}

const getFeedbackText = (mode: string): string => (mode === 'learn' ? 'Continuous feedback' : 'Feedback at the end')

export const QuizDetails = ({ quiz, questionCount, canStart, onStart }: QuizDetailsProps) => (
    <Page id="quiz-welcome" title="Welcome to the quiz">
        <TakeCard id="quiz-details">
            <header>
                <span className="eyebrow">Quiz</span>
                <h2 id="quiz-name">{quiz.title}</h2>
                <p id="quiz-description">{quiz.description}</p>
            </header>
            <div className="details">
                <div className="detail">
                    <span className="label">Time limit</span>
                    <span id="time-limit" className="value">
                        {quiz.timeLimit} seconds
                    </span>
                </div>
                <div className="detail">
                    <span className="label">Question count</span>
                    <span id="question-count" className="value">
                        {questionCount}
                    </span>
                </div>
                <div className="detail">
                    <span className="label">Pass score</span>
                    <span id="pass-score" className="value">
                        {quiz.passScore}%
                    </span>
                </div>
                <div className="detail">
                    <span className="label">Feedback</span>
                    <span id="question-feedback" className="value">
                        {getFeedbackText(quiz.mode)}
                    </span>
                </div>
            </div>
            <footer>
                <StartButton onClick={onStart} disabled={!canStart} />
            </footer>
        </TakeCard>
    </Page>
)
