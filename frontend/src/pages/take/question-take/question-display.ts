import type { Difficulty } from 'model/quiz.ts'

export const stripTag = (text: string): string => text.replace(/^\[[^\]]+\]\s*/, '')

export const shouldShowAnswerCount = (
    isMultipleChoice: boolean,
    isEasy: boolean,
    quizDifficulty: Difficulty | undefined,
): boolean => {
    if (!isMultipleChoice || quizDifficulty === 'hard') return false
    if (quizDifficulty === 'easy') return true
    return isEasy
}
