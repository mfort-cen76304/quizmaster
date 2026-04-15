import './question.scss'
import type { Question, QuestionAnswer } from '#model/question.ts'
import { Answer } from '#pages/take/question-take'
import { QuestionExplanation } from '#pages/take/question-take'

interface QuestionFeedbackProps {
    readonly question: Question
    readonly answer?: QuestionAnswer
}

export const QuestionFeedback = ({ question, answer }: QuestionFeedbackProps) => {
    const isMultipleChoice = question.correctAnswers.length > 1
    const selectedIdxs = answer?.type === 'choice' ? answer.selectedIdxs : undefined
    const selectedValue = answer?.type === 'numerical' ? answer.value : undefined
    let answers = question.answers
    let isCorrect = (idx: number) => question.correctAnswers.includes(idx)
    let isAnswerChecked = (idx: number) => selectedIdxs?.includes(idx) ?? false
    if (selectedValue) {
        if (selectedValue.toString() === question.answers[0]) {
            isCorrect = () => true
            isAnswerChecked = () => true
        } else {
            answers = [...answers, selectedValue.toString()]
            isAnswerChecked = (idx: number) => idx === 1
        }
    }

    return (
        <fieldset
            key={question.id}
            id={`question-${question.id}`}
            className="question-fieldset"
            name={`question-${question.id}`}
        >
            <legend>
                <strong id={`question-name-${question.id}`}>{question.question}</strong>
            </legend>
            <ul id={`question-answers-${question.id}`} className="answers">
                {answers.map((answer, idx) => (
                    <Answer
                        key={answer}
                        isMultipleChoice={isMultipleChoice}
                        idx={idx}
                        questionId={question.id}
                        answer={answer}
                        isCorrect={isCorrect(idx)}
                        explanation={question.explanations[idx]}
                        showFeedback={true}
                        onAnswerChange={() => {}}
                        disabled={true}
                        isAnswerChecked={isAnswerChecked}
                    />
                ))}
            </ul>
            {question.questionExplanation && (
                <div className="row">
                    Question explanation:{'\u00A0'}
                    <QuestionExplanation text={question.questionExplanation} />
                </div>
            )}
            <br />
        </fieldset>
    )
}
