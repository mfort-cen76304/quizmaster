import { QuestionCorrectness } from './correctness.tsx'
import { QuestionExplanation } from './explanation.tsx'
import { QuestionScore } from './question-score.tsx'

interface QuestionFeedbackProps {
    readonly score: number
    readonly explanation: string
}

export const QuestionFeedback = ({ score, explanation }: QuestionFeedbackProps) => (
    <>
        <QuestionCorrectness score={score} />
        <QuestionScore score={score} />
        <QuestionExplanation text={explanation} />
    </>
)
