import type { Question, QuestionTake } from '#model/question.ts'

import { Answer } from './answer.tsx'

interface ChoiceAnswerListProps {
    readonly question: Question | QuestionTake
    readonly showFeedback: (idx: number) => boolean
    readonly onSelectedAnswerChange: (idx: number, selected: boolean) => void
    readonly isAnswerChecked: (idx: number) => boolean
}

export const ChoiceAnswerList = ({
    question,
    showFeedback,
    onSelectedAnswerChange,
    isAnswerChecked,
}: ChoiceAnswerListProps) => {
    const correctAnswers = 'correctAnswers' in question ? question.correctAnswers : []
    const explanations = 'explanations' in question ? question.explanations : []
    const correctAnswerCount =
        'correctAnswers' in question ? question.correctAnswers.length : question.correctAnswerCount
    const hasFeedbackDetails = 'correctAnswers' in question
    const isMultipleChoice = correctAnswerCount > 1

    return (
        <ul className="answers">
            {question.answers.map((answer, idx) => (
                <Answer
                    key={answer}
                    isMultipleChoice={isMultipleChoice}
                    idx={idx}
                    questionId={question.id}
                    answer={answer}
                    isCorrect={correctAnswers.includes(idx)}
                    explanation={explanations[idx] ?? ''}
                    showFeedback={hasFeedbackDetails && showFeedback(idx)}
                    onAnswerChange={onSelectedAnswerChange}
                    isAnswerChecked={isAnswerChecked}
                />
            ))}
        </ul>
    )
}
