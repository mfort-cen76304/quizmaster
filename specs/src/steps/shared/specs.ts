export interface AnswerSpec {
    text: string
    correct: boolean
    explanation?: string
}

export type AnswerSpecs = readonly AnswerSpec[]

export interface QuestionSpec {
    text: string
    answers: AnswerSpec[]
    numericalAnswer?: string
    tolerance?: string
    explanation?: string
    image?: string
    tag?: string
    easy?: boolean
    bookmark?: string
}

export const isNumericalSpec = (spec: QuestionSpec): boolean => spec.numericalAnswer !== undefined

export const isMultipleChoiceSpec = (answers: AnswerSpecs): boolean => answers.filter(a => a.correct).length > 1

export const hasExplanations = (answers: AnswerSpecs): boolean => answers.some(a => a.explanation !== undefined)
