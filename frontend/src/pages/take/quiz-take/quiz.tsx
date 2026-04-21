import './quiz.scss'
import { useRef, useState } from 'react'

import { patchAttempt } from '#api/stats.ts'
import { type AnswerIdxs, type QuestionAnswer, evaluateAnswer } from '#model/question.ts'
import type { Quiz } from '#model/quiz.ts'
import { QuestionForm as StandaloneQuestionForm, QuizQuestionProvider } from '#pages/take/question-take/index.ts'

import { BookmarkList } from './components/bookmark-list.tsx'
import { EvaluateButton, NextButton, BackButton, BookmarkButton } from './components/buttons.tsx'
import { ProgressBar } from './components/progress-bar.tsx'
import { useQuizAnswersState, type QuizAnswers } from './quiz-answers-state.ts'
import { useQuizBookmarkState } from './quiz-bookmark-state.ts'
import { useQuizNavigationState } from './quiz-navigation-state.ts'
import { TimeLimit } from './time-limit/with-time-limit.tsx'

interface QuestionProps {
    readonly quiz: Quiz
    readonly quizRunId: number
    readonly onEvaluate: (quizAnswers: QuizAnswers, timedOut?: boolean) => void
}

export const QuestionForm = (props: QuestionProps) => {
    const { quizAnswers, answerQuestion } = useQuizAnswersState()
    const nav = useQuizNavigationState(props.quiz)
    const bookmarks = useQuizBookmarkState()
    const [selectedAnswerIdxs, setSelectedAnswerIdxs] = useState<AnswerIdxs | undefined>(undefined)
    const answerCounts = useRef({ correct: 0, incorrect: 0 })

    const answer = (questionAnswer: QuestionAnswer) => {
        answerQuestion(nav.currentQuestionIdx, questionAnswer)
        nav.unskip()
    }

    const answerAndNext = (questionAnswer: QuestionAnswer) => {
        answer(questionAnswer)
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

    const handleTimeOut = () => {
        patchAttempt(props.quizRunId, { timedOutAt: new Date().toISOString() })
    }

    const evaluateTimedOut = () => {
        props.onEvaluate(quizAnswers, true)
    }

    const currentQuestion = props.quiz.questions[nav.currentQuestionIdx]
    const currentAnswer = quizAnswers.finalAnswers[nav.currentQuestionIdx]
    const isAnswered = currentAnswer !== undefined
    const hasSelectedAnswer = selectedAnswerIdxs !== undefined && selectedAnswerIdxs.length > 0

    const handleNextButton = () => {
        if (!hasSelectedAnswer) {
            if (!bookmarks.has(nav.currentQuestionIdx)) {
                bookmarks.toggle(nav.currentQuestionIdx)
            }
            nav.skip()
        } else {
            const questionAnswer: QuestionAnswer = { type: 'choice', selectedIdxs: selectedAnswerIdxs }
            answer(questionAnswer)
            const updatedFinalAnswers = [...quizAnswers.finalAnswers]
            updatedFinalAnswers[nav.currentQuestionIdx] = questionAnswer

            const allAnswered = props.quiz.questions.every((_, idx) => updatedFinalAnswers[idx] !== undefined)

            if (allAnswered) {
                props.onEvaluate({ firstAnswers: quizAnswers.firstAnswers, finalAnswers: updatedFinalAnswers }, false)
            } else {
                nav.next()
            }
        }
    }

    const revertPreviousAnswerCount = () => {
        if (currentAnswer !== undefined) {
            const previousResult = evaluateAnswer(currentQuestion, currentAnswer)
            if (previousResult.correct) {
                answerCounts.current.correct--
            } else {
                answerCounts.current.incorrect--
            }
        }
    }

    const handleAnswerSubmitted = (questionAnswer: QuestionAnswer) => {
        revertPreviousAnswerCount()
        const result = evaluateAnswer(currentQuestion, questionAnswer)
        if (result.correct) {
            answerCounts.current.correct++
        } else {
            answerCounts.current.incorrect++
        }
        patchAttempt(props.quizRunId, {
            correctAnswers: answerCounts.current.correct,
            incorrectAnswers: answerCounts.current.incorrect,
        })

        if (props.quiz.mode === 'learn') {
            answer(questionAnswer)
        } else {
            answerAndNext(questionAnswer)
        }
    }

    return (
        <div className="quiz-page">
            <TimeLimit timeLimit={props.quiz.timeLimit} onTimeOut={handleTimeOut} onConfirm={evaluateTimedOut} />
            <h2>Quiz</h2>
            <div className="feedback-mode-row">
                <div id="feedback-mode">Feedback mode:</div>
                <label className="feedback-mode-label">{props.quiz.mode}</label>
            </div>

            <ProgressBar current={nav.currentQuestionIdx + 1} total={props.quiz.questions.length} />

            <QuizQuestionProvider
                value={{
                    selectedAnswerIdxs: currentAnswer?.type === 'choice' ? currentAnswer.selectedIdxs : [],
                    onSubmitted: handleAnswerSubmitted,
                    onAnswerSelected: idxs => {
                        setSelectedAnswerIdxs(idxs)
                    },
                    showFeedbackOnSubmit: props.quiz.mode === 'learn',
                    difficulty: props.quiz.difficulty,
                }}
            >
                <StandaloneQuestionForm key={currentQuestion.id} question={currentQuestion} />
            </QuizQuestionProvider>
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
