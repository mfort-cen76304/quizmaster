import { useState } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router'

import { CrazyBackground } from '#fe/crazy-background.tsx'
import { ROUTES } from '#fe/urls.ts'
import { CreateQuestionPage } from '#pages/make/create-question/create-question-page.tsx'
import { EditQuestionPage } from '#pages/make/create-question/edit-question-page.tsx'
import { WorkspaceCreatePage } from '#pages/make/create-workspace/workspace-create-page.tsx'
import { HomePage } from '#pages/make/home.tsx'
import { QuizStatsPage } from '#pages/make/quiz-stats/quiz-stats-page.tsx'
import { QuizEditPage } from '#pages/make/quiz/quiz-edit-page.tsx'
import { WorkspacePage } from '#pages/make/workspace/workspace.tsx'
import { QuestionTakePage } from '#pages/take/question-take'
import { QuizTakePage } from '#pages/take/quiz-take/quiz-take-page.tsx'
import { QuizWelcomePage } from '#pages/take/quiz-take/quiz-welcome/quiz-welcome-page.tsx'

const isAutomatedBrowser = typeof navigator !== 'undefined' && navigator.webdriver
const shouldRenderCrazyBackground = !isAutomatedBrowser

type PiCornerToggleProps = {
    readonly animationOnly: boolean
    readonly onToggle: () => void
}

const PiCornerToggle = ({ animationOnly, onToggle }: PiCornerToggleProps) => {
    const [isVisible, setVisible] = useState(false)

    return (
        <div
            onMouseEnter={() => setVisible(true)}
            onMouseLeave={() => setVisible(false)}
            style={{
                position: 'fixed',
                left: 0,
                bottom: 0,
                zIndex: 3,
                width: 72,
                height: 72,
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'flex-start',
                padding: 14,
            }}
        >
            <button
                aria-label={animationOnly ? 'Show interface' : 'Show animation only'}
                onBlur={() => setVisible(false)}
                onClick={onToggle}
                onFocus={() => setVisible(true)}
                style={{
                    width: 26,
                    height: 26,
                    border: '1px solid rgba(16, 35, 63, 0.24)',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.82)',
                    color: '#10233f',
                    cursor: 'pointer',
                    fontFamily: 'Georgia, serif',
                    fontSize: 15,
                    lineHeight: 1,
                    opacity: isVisible ? 0.88 : 0,
                    transition: 'opacity 0.18s ease',
                }}
                type="button"
            >
                π
            </button>
        </div>
    )
}

export const App = () => {
    const [animationOnly, setAnimationOnly] = useState(false)

    return (
        <BrowserRouter>
            {/* Crazy Background takes too long in tests and makes timeouts */}
            {shouldRenderCrazyBackground && <CrazyBackground />}
            <div style={{ display: animationOnly ? 'none' : undefined, position: 'relative', zIndex: 1 }}>
                <Routes>
                    <Route path={ROUTES.home} element={<HomePage />} />

                    {/* Public question taking */}
                    <Route path={ROUTES.questionTake} element={<QuestionTakePage />} />

                    {/* Workspace */}
                    <Route path={ROUTES.workspaceNew} element={<WorkspaceCreatePage />} />
                    <Route path={ROUTES.workspace} element={<WorkspacePage />} />
                    <Route path={ROUTES.workspaceQuestionNew} element={<CreateQuestionPage />} />
                    <Route path={ROUTES.workspaceQuestionEdit} element={<EditQuestionPage />} />

                    {/* Quiz management (workspace-scoped) */}
                    <Route path={ROUTES.workspaceQuizNew} element={<QuizEditPage />} />
                    <Route path={ROUTES.workspaceQuizEdit} element={<QuizEditPage />} />
                    <Route path={ROUTES.workspaceQuizStats} element={<QuizStatsPage />} />
                    <Route path={ROUTES.workspaceQuizDryRun} element={<QuizWelcomePage isDryRun={true} />} />
                    <Route path={ROUTES.workspaceQuizDryRunTake} element={<QuizTakePage isDryRun={true} />} />

                    {/* Quiz taking (public) */}
                    <Route path={ROUTES.quizWelcome} element={<QuizWelcomePage isDryRun={false} />} />
                    <Route path={ROUTES.quizTake} element={<QuizTakePage isDryRun={false} />} />
                </Routes>
            </div>
            <PiCornerToggle animationOnly={animationOnly} onToggle={() => setAnimationOnly(value => !value)} />
        </BrowserRouter>
    )
}
