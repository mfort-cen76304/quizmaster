import type { AnswerStatus } from '#fe/take/model/question.ts'

import { QuestionCorrectness } from './correctness.tsx'
import { QuestionExplanation } from './explanation.tsx'
import { QuestionScore } from './question-score.tsx'

interface QuestionFeedbackProps {
    readonly status: AnswerStatus
    readonly score: number
    readonly explanation: string
}

export const QuestionFeedback = ({ status, score, explanation }: QuestionFeedbackProps) => (
    <>
        <QuestionCorrectness status={status} />
        <QuestionScore score={score} />
        <QuestionExplanation text={explanation} />
    </>
)
