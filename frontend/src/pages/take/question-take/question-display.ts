import type { Difficulty } from '#model/quiz.ts'

export const shouldShowAnswerCount = (
    isMultipleChoice: boolean,
    isEasy: boolean,
    quizDifficulty: Difficulty,
): boolean => {
    if (!isMultipleChoice || quizDifficulty === 'hard') return false
    if (quizDifficulty === 'easy') return true
    return isEasy
}
