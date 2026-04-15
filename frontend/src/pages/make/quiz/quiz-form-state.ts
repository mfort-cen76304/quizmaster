import { useMemo, useState } from 'react'

import type { QuizCreateRequest } from '#api/quiz.ts'
import { useStateSet } from '#fe/helpers.ts'
import type { QuestionListItem } from '#model/question-list-item.ts'
import type { Quiz } from '#model/quiz.ts'
import type { QuizMode, Difficulty } from '#model/quiz.ts'

export type QuizEditFormData = QuizCreateRequest

const formatDateTimeInputValue = (value?: string | null) => value?.slice(0, 16) ?? ''
const toApiDateTimeValue = (value: string) => value || null

export const useQuizFormState = (questions: readonly QuestionListItem[], quiz?: Quiz) => {
    const [title, setTitle] = useState(quiz?.title || '')
    const [description, setDescription] = useState(quiz?.description || '')
    const [startAt, setStartAt] = useState(formatDateTimeInputValue(quiz?.startAt))
    const [endAt, setEndAt] = useState(formatDateTimeInputValue(quiz?.endAt))
    const [selectedIds, toggleSelectedId] = useStateSet(quiz?.questions?.map(q => q.id))
    const [timeLimit, setTimeLimit] = useState(quiz?.timeLimit ?? 600)
    const [randomQuestionCount, setRandomQuestionCount] = useState(quiz?.randomQuestionCount ?? 0)
    const [passScore, setPassScore] = useState(quiz?.passScore ?? 80)
    const [filter, setFilter] = useState('')
    const [checkRandomize, setCheckRandomize] = useState(!!quiz?.randomQuestionCount)
    const [feedbackMode, setFeedbackMode] = useState<QuizMode>(quiz?.mode || 'exam')
    const [difficulty, setDifficulty] = useState<Difficulty>(quiz?.difficulty || 'keep-question')

    const filteredQuestions = useMemo(() => {
        const normalizedFilter = filter.trim().toLowerCase()
        if (normalizedFilter === '') return questions

        const tokens = normalizedFilter.split(/\s+/).filter(Boolean)

        return questions.filter(q => {
            const searchableText = [q.question, ...q.tags].join(' ').toLowerCase()
            return tokens.every(token => searchableText.includes(token))
        })
    }, [filter, questions])

    return {
        title,
        description,
        startAt,
        endAt,
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
        setStartAt,
        setEndAt,
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
    startAt: toApiDateTimeValue(state.startAt),
    endAt: toApiDateTimeValue(state.endAt),
    questionIds: Array.from(state.selectedIds),
    mode: state.feedbackMode,
    difficulty: state.difficulty,
    passScore: state.passScore,
    timeLimit: state.timeLimit,
    workspaceGuid: workspaceId,
    randomQuestionCount: state.randomQuestionCount,
})
