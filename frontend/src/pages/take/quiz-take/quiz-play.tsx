import './quiz-play.scss'
import { useRef, useState } from 'react'

import { patchAttempt, recordQuizQuestionAnswer, submitQuizQuestionAnswer } from '#api/stats.ts'
import { type AnswerIdxs, type QuestionAnswer, type QuestionEvaluation, evaluateAnswer } from '#model/question.ts'
import type { Quiz, QuizMode, QuizTake } from '#model/quiz.ts'
import { QuestionForm, QuizQuestionProvider } from '#pages/take/question-take/index.ts'

import { BookmarkList } from './components/bookmark-list.tsx'
import { BackButton, BookmarkButton, EvaluateButton, NextButton } from './components/buttons.tsx'
import { ProgressBar } from './components/progress-bar.tsx'
import { useQuizAnswersState, type QuizAnswers } from './quiz-answers-state.ts'
import { useQuizBookmarkState } from './quiz-bookmark-state.ts'
import { useQuizNavigationState } from './quiz-navigation-state.ts'
import { TimeLimit } from './time-limit/with-time-limit.tsx'

interface QuizPlayFormProps {
    readonly quiz: Quiz | QuizTake
    readonly quizRunId: number | null
    readonly questionsBaseUrl: string
    readonly onEvaluate: (quizAnswers: QuizAnswers, timedOut?: boolean) => void
}

const feedbackModeLabel = (mode: QuizMode): string => (mode === 'learn' ? 'Continuous feedback' : 'Feedback at the end')

export const QuizPlayForm = (props: QuizPlayFormProps) => {
    const { quizAnswers, answerQuestion } = useQuizAnswersState()
    const nav = useQuizNavigationState(props.quiz, props.questionsBaseUrl)
    const bookmarks = useQuizBookmarkState()
    const [selectedAnswerIdxs, setSelectedAnswerIdxs] = useState<AnswerIdxs | undefined>(undefined)
    const answerCounts = useRef({ correct: 0, partial: 0, incorrect: 0 })

    const answer = (questionAnswer: QuestionAnswer) => {
        answerQuestion(nav.currentQuestionIdx, questionAnswer)
        nav.unskip()
    }

    const bookmark = () => bookmarks.toggle(nav.currentQuestionIdx)

    const bookmarkList = Array.from(bookmarks.questionIdxs).map(questionIdx => ({
        title: props.quiz.questions[questionIdx].question,
        onClick: () => nav.goto(questionIdx),
        onDelete: () => bookmarks.remove(questionIdx),
    }))

    const evaluate = () => {
        props.onEvaluate(quizAnswers, false)
    }

    const handleTimeOut = async () => {
        if (props.quizRunId === null) return
        await patchAttempt(props.quizRunId, { timedOutAt: new Date().toISOString() })
    }

    const evaluateTimedOut = () => {
        props.onEvaluate(quizAnswers, true)
    }

    const currentQuestion = props.quiz.questions[nav.currentQuestionIdx]
    const currentAnswer = quizAnswers.finalAnswers[nav.currentQuestionIdx]
    const authoringQuestion = 'correctAnswers' in currentQuestion ? currentQuestion : undefined
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

    const adjustCount = (score: number, delta: 1 | -1) => {
        if (score === 1) answerCounts.current.correct += delta
        else if (score === 0.5) answerCounts.current.partial += delta
        else answerCounts.current.incorrect += delta
    }

    const revertPreviousAnswerCount = () => {
        if (currentAnswer !== undefined && authoringQuestion) {
            const previousResult = evaluateAnswer(authoringQuestion, currentAnswer)
            adjustCount(previousResult.score, -1)
        }
    }

    const handleAnswerSubmitted = async (questionAnswer: QuestionAnswer): Promise<QuestionEvaluation | void> => {
        revertPreviousAnswerCount()
        const result = authoringQuestion
            ? evaluateAnswer(authoringQuestion, questionAnswer)
            : props.quizRunId !== null && props.quiz.mode === 'learn'
              ? await submitQuizQuestionAnswer(props.quiz.id, props.quizRunId, currentQuestion.id, questionAnswer)
              : undefined

        if (!authoringQuestion && props.quizRunId !== null && props.quiz.mode === 'exam') {
            await recordQuizQuestionAnswer(props.quiz.id, props.quizRunId, currentQuestion.id, questionAnswer)
        }

        if (result) {
            adjustCount(result.score, 1)
        }
        if (props.quizRunId !== null && result) {
            patchAttempt(props.quizRunId, {
                correctAnswers: answerCounts.current.correct,
                partiallyCorrectAnswers: answerCounts.current.partial,
                incorrectAnswers: answerCounts.current.incorrect,
            })
        }

        if (props.quiz.mode === 'learn') {
            answer(questionAnswer)
        } else {
            answer(questionAnswer)
            if (!nav.isLastQuestion) {
                nav.next()
            }
        }

        return result
    }

    return (
        <div className="page quiz-play" id="quiz-play">
            <div className="quiz-play-status">
                <span className="feedback-mode-chip" id="feedback-mode" data-mode={props.quiz.mode}>
                    {feedbackModeLabel(props.quiz.mode)}
                </span>
                <TimeLimit timeLimit={props.quiz.timeLimit} onTimeOut={handleTimeOut} onConfirm={evaluateTimedOut} />
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
                <QuestionForm key={currentQuestion.id} question={currentQuestion} />
            </QuizQuestionProvider>

            <div className="quiz-play-actions">
                {nav.canBack && <BackButton onClick={nav.back} />}
                <BookmarkButton isBookmarked={bookmarks.has(nav.currentQuestionIdx)} onClick={bookmark} />
                {nav.canNext && <NextButton onClick={handleNextButton} />}
                {isAnswered && !nav.canNext && <EvaluateButton onClick={evaluate} />}
            </div>

            <BookmarkList bookmarks={bookmarkList} />
        </div>
    )
}
