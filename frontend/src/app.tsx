import { useEffect, useState } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router'

import { CreateQuestionPage } from '#fe/make/create-question/create-question-page.tsx'
import { EditQuestionPage } from '#fe/make/create-question/edit-question-page.tsx'
import { WorkspaceCreatePage } from '#fe/make/create-workspace/workspace-create-page.tsx'
import { HomePage } from '#fe/make/home.tsx'
import { QuizStatsPage } from '#fe/make/quiz-stats/quiz-stats-page.tsx'
import { QuizEditPage } from '#fe/make/quiz/quiz-edit-page.tsx'
import { WorkspacePage } from '#fe/make/workspace/workspace.tsx'
import { QuestionTakePage } from '#fe/take/question-take'
import { QuizTakePage } from '#fe/take/quiz-take/quiz-take-page.tsx'
import { QuizWelcomePage } from '#fe/take/quiz-take/quiz-welcome/quiz-welcome-page.tsx'
import { ROUTES } from '#fe/urls.ts'

const BG_STORAGE_KEY = 'crazyBgEnabled'

function readBgEnabled(): boolean {
    try {
        return localStorage.getItem(BG_STORAGE_KEY) !== 'false'
    } catch {
        return true
    }
}

type CrazyBgToggleProps = {
    readonly enabled: boolean
    readonly onToggle: () => void
}

const CrazyBgToggle = ({ enabled, onToggle }: CrazyBgToggleProps) => (
    <button
        aria-label={enabled ? 'Turn off background animation' : 'Turn on background animation'}
        onClick={onToggle}
        style={{
            position: 'fixed',
            bottom: 14,
            left: 14,
            zIndex: 3,
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            padding: '5px 10px 5px 8px',
            border: '1px solid rgba(16, 35, 63, 0.18)',
            borderRadius: 20,
            background: 'rgba(255, 255, 255, 0.82)',
            color: '#10233f',
            cursor: 'pointer',
            fontSize: 12,
            fontFamily: 'Georgia, serif',
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        }}
        type="button"
    >
        <span style={{ fontSize: 14, lineHeight: 1 }}>{enabled ? '👼' : '🚫'}</span>
        <span
            style={{
                position: 'relative',
                display: 'inline-block',
                width: 30,
                height: 16,
                borderRadius: 8,
                background: enabled ? '#7c3aed' : '#d1d5db',
                transition: 'background 0.2s',
                flexShrink: 0,
            }}
        >
            <span
                style={{
                    position: 'absolute',
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    background: 'white',
                    top: 2,
                    left: enabled ? 16 : 2,
                    transition: 'left 0.2s',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                }}
            />
        </span>
    </button>
)

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
                pointerEvents: 'none',
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
                    pointerEvents: 'auto',
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
    const [bgEnabled, setBgEnabled] = useState(readBgEnabled)

    useEffect(() => {
        const canvas = document.querySelector<HTMLCanvasElement>('#crazy-bg')
        if (canvas) canvas.style.display = bgEnabled ? '' : 'none'
        if (bgEnabled) {
            window.__crazyBg?.resume()
        } else {
            window.__crazyBg?.stop()
        }
        try {
            localStorage.setItem(BG_STORAGE_KEY, String(bgEnabled))
        } catch {}
    }, [bgEnabled])

    return (
        <BrowserRouter>
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
                    <Route path={ROUTES.quizWelcomeWithCohort} element={<QuizWelcomePage isDryRun={false} />} />
                    <Route path={ROUTES.quizTake} element={<QuizTakePage isDryRun={false} />} />
                </Routes>
            </div>
            <CrazyBgToggle enabled={bgEnabled} onToggle={() => setBgEnabled(v => !v)} />
            <PiCornerToggle animationOnly={animationOnly} onToggle={() => setAnimationOnly(value => !value)} />
        </BrowserRouter>
    )
}
