import './quiz.scss'
import { useState } from 'react'

import { updated } from '#fe/helpers.ts'
import type { AnswerIdxs } from '#model/question.ts'
import type { Quiz } from '#model/quiz.ts'
import { QuestionForm as StandaloneQuestionForm, shouldShowAnswerCount } from '#pages/take/question-take/index.ts'

import { BookmarkList } from './components/bookmark-list.tsx'
import { EvaluateButton, NextButton, BackButton, BookmarkButton } from './components/buttons.tsx'
import { ProgressBar } from './components/progress-bar.tsx'
import { useQuizAnswersState, type QuizAnswers } from './quiz-answers-state.ts'
import { useQuizBookmarkState } from './quiz-bookmark-state.ts'
import { useQuizNavigationState } from './quiz-navigation-state.ts'
import { TimeLimit } from './time-limit/with-time-limit.tsx'

interface QuestionProps {
    readonly quiz: Quiz
    readonly onEvaluate: (quizAnswers: QuizAnswers, timedOut?: boolean) => void
}

export type QuizState = readonly AnswerIdxs[]

export const QuestionForm = (props: QuestionProps) => {
    const { quizAnswers, answerQuestion } = useQuizAnswersState()
    const nav = useQuizNavigationState(props.quiz)
    const bookmarks = useQuizBookmarkState()
    const [selectedAnswers, setSelectedAnswers] = useState<AnswerIdxs | undefined>(undefined)

    const answer = (selectedAnswerIdxs: AnswerIdxs) => {
        answerQuestion(nav.currentQuestionIdx, selectedAnswerIdxs)
        nav.unskip()
    }

    const answerAndNext = (selectedAnswerIdxs: AnswerIdxs) => {
        answer(selectedAnswerIdxs)
        if (!nav.isLastQuestion) {
            nav.next()
        }
    }

    const bookmark = () => bookmarks.toggle(nav.currentQuestionIdx)

    // Prepare bookmarks for BookmarkList
    const bookmarkList = Array.from(bookmarks.questionIdxs).map(questionIdx => ({
        title: props.quiz.questions[questionIdx].question,
        onClick: () => nav.goto(questionIdx),
        onDelete: () => bookmarks.remove(questionIdx),
    }))

    const evaluate = () => {
        props.onEvaluate(quizAnswers, false)
    }

    const evaluateTimedOut = () => {
        props.onEvaluate(quizAnswers, true)
    }

    const currentQuestion = props.quiz.questions[nav.currentQuestionIdx]
    const currentAnswers = quizAnswers.finalAnswers[nav.currentQuestionIdx]
    const isAnswered = currentAnswers !== undefined
    const hasSelectedAnswer = selectedAnswers !== undefined && selectedAnswers.length > 0

    const handleNextButton = () => {
        if (!hasSelectedAnswer) {
            if (!bookmarks.has(nav.currentQuestionIdx)) {
                bookmarks.toggle(nav.currentQuestionIdx)
            }
            nav.skip()
        } else {
            answer(selectedAnswers)
            const updatedQuizAnswers: QuizAnswers = {
                firstAnswers: quizAnswers.firstAnswers,
                finalAnswers: updated(quizAnswers.finalAnswers, nav.currentQuestionIdx, selectedAnswers),
            }

            const allAnswered = props.quiz.questions.every(
                (_, idx) => updatedQuizAnswers.finalAnswers[idx] !== undefined,
            )

            if (allAnswered) {
                props.onEvaluate(updatedQuizAnswers, false)
            } else {
                nav.next()
            }
        }
    }

    const handleAnswerSubmitted = (answers: AnswerIdxs) => {
        setSelectedAnswers(answers)
        if (props.quiz.mode === 'learn') {
            answer(answers)
        } else {
            answerAndNext(answers)
        }
    }

    return (
        <div>
            <TimeLimit timeLimit={props.quiz.timeLimit} onConfirm={evaluateTimedOut} />
            <h2>Quiz</h2>
            <div className="feedback-mode-row">
                <div id="feedback-mode">Feedback mode:</div>
                <label className="feedback-mode-label">{props.quiz.mode}</label>
            </div>

            <ProgressBar current={nav.currentQuestionIdx + 1} total={props.quiz.questions.length} />

            <StandaloneQuestionForm
                key={currentQuestion.id}
                question={currentQuestion}
                selectedAnswerIdxs={quizAnswers.finalAnswers[nav.currentQuestionIdx]}
                onAnswerSelected={answers => {
                    setSelectedAnswers(answers)
                }}
                onSubmitted={handleAnswerSubmitted}
                showFeedbackOnSubmit={props.quiz.mode === 'learn'}
                showAnswerCount={shouldShowAnswerCount(
                    currentQuestion.correctAnswers.length > 1,
                    currentQuestion.isEasy,
                    props.quiz.difficulty,
                )}
            />
            <div className="quiz-button-bar">
                {nav.canBack && <BackButton onClick={nav.back} />}
                {nav.canNext && <NextButton onClick={handleNextButton} />}
                {isAnswered && !nav.canNext && <EvaluateButton onClick={evaluate} />}
                <BookmarkButton isBookmarked={bookmarks.has(nav.currentQuestionIdx)} onClick={bookmark} />
            </div>

            {/* Bookmark list visible for tests */}
            <BookmarkList bookmarks={bookmarkList} />
        </div>
    )
}
