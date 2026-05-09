import type { Quiz } from '#fe/model/quiz.ts'

const toDate = (value: string | null) => (value ? new Date(value) : null)

export const isQuizAvailable = (quiz: Pick<Quiz, 'startAt' | 'endAt'>, now: Date = new Date()) => {
    const startAt = toDate(quiz.startAt)
    const endAt = toDate(quiz.endAt)

    if (startAt && now < startAt) return false
    if (endAt && now > endAt) return false

    return true
}
