import './question.scss'
import type { Question, QuestionAnswer } from '#model/question.ts'
import { Answer } from '#pages/take/question-take'
import { QuestionExplanation } from '#pages/take/question-take'
import { NumericalResult } from '#pages/take/question-take/components/numerical-result.tsx'

interface QuestionFeedbackProps {
    readonly question: Question
    readonly answer?: QuestionAnswer
}

export const QuestionFeedback = ({ question, answer }: QuestionFeedbackProps) => {
    const isMultipleChoice = question.correctAnswers.length > 1
    const selectedIdxs = answer?.type === 'choice' ? answer.selectedIdxs : undefined
    const isNumerical = question.questionType === 'numerical'
    const numericalUserInput = answer?.type === 'numerical' ? answer.value.toString() : ''
    const isCorrect = (idx: number) => question.correctAnswers.includes(idx)
    const isAnswerChecked = (idx: number) => selectedIdxs?.includes(idx) ?? false

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
            {isNumerical ? (
                <NumericalResult question={question} userInput={numericalUserInput} />
            ) : (
                <ul id={`question-answers-${question.id}`} className="answers">
                    {question.answers.map((answer, idx) => (
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
            )}
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
