import type { QuestionFormState } from './question-form-state.ts'

export const errorMessage = {
    'empty-question': 'Question must not be empty.',
    'empty-answer': 'Answers must not be empty.',
    'no-correct-answer': 'At least one correct answer must be selected.',
    'empty-answer-explanation': 'All or none answer explanations must be filled in.',
    'few-correct-answers': 'Multiple choice questions must have at least two correct answers.',
    'empty-numerical-answer': 'Correct numerical answer must not be empty.',
    'invalid-numerical-answer': 'Correct numerical answer must be a number.',
}

type ErrorCode = keyof typeof errorMessage

export function validateQuestionFormState(state: QuestionFormState): Set<ErrorCode> {
    const errors = new Set<ErrorCode>()

    const correctAnswerCount = state.correctAnswers.length
    const emptyAnswerCount = state.answers.filter(answer => answer.trim() === '').length
    const emptyExplanationCount = state.explanations.filter(explanation => explanation.trim() === '').length
    const nonEmptyExplanationCount = state.explanations.filter(explanation => explanation.trim() !== '').length

    if (state.questionText.trim() === '') errors.add('empty-question')

    if (state.isNumerical) {
        const numericalValue = state.numericalAnswer.trim()
        if (numericalValue === '') {
            errors.add('empty-numerical-answer')
        } else if (!/^-?\d+(\.\d+)?$/.test(numericalValue)) {
            errors.add('invalid-numerical-answer')
        }
        return errors
    }

    if (emptyAnswerCount > 0) errors.add('empty-answer')
    if (correctAnswerCount === 0) errors.add('no-correct-answer')
    if (state.isMultipleChoice && correctAnswerCount < 2) errors.add('few-correct-answers')
    if (emptyExplanationCount > 0 && nonEmptyExplanationCount > 0) errors.add('empty-answer-explanation')

    return errors
}
