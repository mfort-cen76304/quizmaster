import { useMemo, useState } from 'react'

import { useStateSet } from '#fe/helpers'
import type { QuestionListItem } from '#fe/model/question-list-item.ts'
import type { Quiz } from '#fe/model/quiz.ts'
import type { QuizMode, Difficulty } from '#fe/model/quiz.ts'
import type { QuizCreateRequest } from '#fe/api/quiz.ts'

export type QuizEditFormData = QuizCreateRequest

export const useQuizFormState = (questions: readonly QuestionListItem[], quiz?: Quiz) => {
    const [title, setTitle] = useState(quiz?.title || '')
    const [description, setDescription] = useState(quiz?.description || '')
    const [selectedIds, toggleSelectedId] = useStateSet(quiz?.questions?.map(q => q.id))
    const [timeLimit, setTimeLimit] = useState(quiz?.timeLimit ?? 600)
    const [randomQuestionCount, setRandomQuestionCount] = useState(quiz?.randomQuestionCount ?? 0)
    const [passScore, setPassScore] = useState(quiz?.passScore ?? 80)
    const [filter, setFilter] = useState('')
    const [checkRandomize, setCheckRandomize] = useState(!!quiz?.randomQuestionCount)
    const [feedbackMode, setFeedbackMode] = useState<QuizMode>(quiz?.mode || 'exam')
    const [difficulty, setDifficulty] = useState<Difficulty>(quiz?.difficulty || 'keep-question')

    const filteredQuestions = useMemo(() => {
        if (filter === '') return questions
        return questions.filter(q => q.question.toLowerCase().includes(filter.toLowerCase()))
    }, [filter, questions])

    return {
        title,
        description,
        selectedIds,
        timeLimit,
        randomQuestionCount,
        passScore,
        filter,
        checkRandomize,
        filteredQuestions,
        feedbackMode,
        difficulty,
        setTitle,
        setDescription,
        toggleSelectedId,
        setTimeLimit,
        setRandomQuestionCount,
        setPassScore,
        setFilter,
        setCheckRandomize,
        setFeedbackMode,
        setDifficulty,
    }
}

export const stateToQuizApiData = (
    state: ReturnType<typeof useQuizFormState>,
    workspaceId: string | null,
): QuizEditFormData => ({
    title: state.title,
    description: state.description,
    questionIds: Array.from(state.selectedIds),
    mode: state.feedbackMode,
    difficulty: state.difficulty,
    passScore: state.passScore,
    timeLimit: state.timeLimit,
    workspaceGuid: workspaceId,
    randomQuestionCount: state.randomQuestionCount,
})
