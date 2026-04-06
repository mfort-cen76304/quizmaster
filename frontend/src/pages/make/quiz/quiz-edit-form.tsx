import './quiz-edit-form.scss'
import { useState } from 'react'
import { useNavigate } from 'react-router'

import { urls, useWorkspaceId } from '#fe/urls.ts'
import type { QuestionListItem } from '#model/question-list-item.ts'
import type { Quiz } from '#model/quiz.ts'
import { Field, Form, NumberInput, RadioSet, Row, SubmitButton, TextArea, TextInput } from '#pages/components'
import { ErrorMessage, createValidator } from '#pages/components/forms/validations.tsx'

import { QuestionCountInfo } from './components/question-count-info.tsx'
import { QuestionSelect } from './components/question-select.tsx'
import { RandomSubsetSection } from './components/random-subset-section.tsx'
import { useQuizFormState, stateToQuizApiData, type QuizEditFormData } from './quiz-form-state.ts'
import { formatTimeLimit } from './utils/formatTimeLimit.ts'
import { validateQuizForm, errorMessage } from './validations.ts'

const TIME_LIMIT_PARTIAL_REGEX = /^(?:\d*|\d+m|\d+s|\d+m\d*|\d+s\d*|\d+m\d+s|\d+s\d+m)$/i

const parseTimeLimitToSeconds = (value: string): number => {
    const minutesAndSeconds = value.match(/^(\d+)m(\d+)s$/i)
    if (minutesAndSeconds) {
        return Number(minutesAndSeconds[1]) * 60 + Number(minutesAndSeconds[2])
    }

    const secondsAndMinutes = value.match(/^(\d+)s(\d+)m$/i)
    if (secondsAndMinutes) {
        return Number(secondsAndMinutes[1]) + Number(secondsAndMinutes[2]) * 60
    }

    const onlyMinutes = value.match(/^(\d+)m$/i)
    if (onlyMinutes) {
        return Number(onlyMinutes[1]) * 60
    }

    const onlySeconds = value.match(/^(\d+)s$/i)
    if (onlySeconds) {
        return Number(onlySeconds[1])
    }

    return Number.NaN
}

interface QuizEditFormProps {
    readonly questions: readonly QuestionListItem[]
    readonly onSubmit: (data: QuizEditFormData) => void
    readonly quiz?: Quiz
}
export const QuizEditForm = ({ questions, onSubmit, quiz }: QuizEditFormProps) => {
    const workspaceId = useWorkspaceId()
    const navigate = useNavigate()
    const state = useQuizFormState(questions, quiz)
    const [timeLimitText, setTimeLimitText] = useState(`${state.timeLimit}s`)

    const validator = createValidator(() => validateQuizForm(state), errorMessage)

    const onBack = () => {
        navigate(urls.workspace(workspaceId))
    }

    const onTimeLimitTextChange = (value: string) => {
        const inputIsValid = TIME_LIMIT_PARTIAL_REGEX.test(value)
        if (!inputIsValid) {
            return
        }

        setTimeLimitText(value)

        if (inputIsValid) {
            const parsedTime = parseTimeLimitToSeconds(value)
            state.setTimeLimit(parsedTime)
        }
    }

    return (
        <Form id="create-quiz" validator={validator} onSubmit={() => onSubmit(stateToQuizApiData(state, workspaceId))}>
            <Field label="Quiz title" required>
                <TextInput id="quiz-title" value={state.title} onChange={state.setTitle} />
                <ErrorMessage errorCode="empty-title" />
            </Field>
            <Field label="Quiz description">
                <TextArea id="quiz-description" value={state.description} onChange={state.setDescription} />
            </Field>
            <Row>
                <Field label="Pass score (in %)">
                    <NumberInput id="pass-score" value={state.passScore} onChange={state.setPassScore} />
                    <ErrorMessage errorCode="score-above-max" />
                </Field>
                <Field label="Time limit (eg. 10m30s)">
                    <Row>
                        <TextInput id="time-limit" value={timeLimitText} onChange={onTimeLimitTextChange} />
                        <span id="formatted-time-limit" className="bold-count">
                            {formatTimeLimit(state.timeLimit)}
                        </span>
                    </Row>
                    <ErrorMessage errorCode="time-limit-above-max" />
                    <ErrorMessage errorCode="time-limit-invalid-format" />
                </Field>
            </Row>
            <Field label="Feedback mode">
                <RadioSet
                    name="mode"
                    value={state.feedbackMode}
                    onChange={state.setFeedbackMode}
                    options={{ exam: 'Exam', learn: 'Learning' }}
                />
            </Field>
            <Field label="Difficulty">
                <RadioSet
                    name="difficulty"
                    value={state.difficulty}
                    onChange={state.setDifficulty}
                    options={{ easy: 'Easy', hard: 'Hard', 'keep-question': 'Keep Question' }}
                />
            </Field>
            <div className="label">Select quiz questions</div>
            <Field label="Search questions">
                <TextInput id="question-filter" value={state.filter} onChange={state.setFilter} />
            </Field>
            <QuestionSelect
                questions={state.filteredQuestions}
                selectedIds={state.selectedIds}
                onSelect={state.toggleSelectedId}
            />
            <ErrorMessage errorCode="few-questions" />

            <QuestionCountInfo selectedCount={state.selectedIds.size} totalCount={questions.length} />

            <RandomSubsetSection
                enabled={state.checkRandomize}
                onEnabledChange={state.setCheckRandomize}
                count={state.randomQuestionCount}
                onCountChange={state.setRandomQuestionCount}
            />
            <div className="flex-container">
                <button id="back" type="button" className="primary button" onClick={onBack}>
                    Back
                </button>
                <SubmitButton />
            </div>
        </Form>
    )
}
