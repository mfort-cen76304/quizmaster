import type { Question } from '#model/question.ts'

import { Answer } from './answer.tsx'

interface ChoiceAnswerListProps {
    readonly question: Question
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
    const isMultipleChoice = question.correctAnswers.length > 1

    return (
        <ul className="answers">
            {question.answers.map((answer, idx) => (
                <Answer
                    key={answer}
                    isMultipleChoice={isMultipleChoice}
                    idx={idx}
                    questionId={question.id}
                    answer={answer}
                    isCorrect={question.correctAnswers.includes(idx)}
                    explanation={question.explanations ? question.explanations[idx] : 'not defined'}
                    showFeedback={showFeedback(idx)}
                    onAnswerChange={onSelectedAnswerChange}
                    isAnswerChecked={isAnswerChecked}
                />
            ))}
        </ul>
    )
}
