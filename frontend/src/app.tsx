import { BrowserRouter, Route, Routes } from 'react-router'

import { HomePage } from '#fe/pages/make/home'
import { QuestionTakePage } from '#fe/pages/take/question-take'
import { QuizTakePage } from '#fe/pages/take/quiz-take/quiz-take-page.tsx'

import { QuizWelcomePage } from '#fe/pages/take/quiz-take/quiz-welcome/quiz-welcome-page'

import { WorkspaceCreatePage } from '#fe/pages/make/create-workspace/workspace-create-page'
import { CreateQuestionPage } from '#fe/pages/make/create-question/create-question-page'
import { EditQuestionPage } from '#fe/pages/make/create-question/edit-question-page'
import { WorkspacePage } from '#fe/pages/make/workspace/workspace'
import { QuizEditPage } from '#fe/pages/make/quiz/quiz-edit-page'
import { QuizStatsPage } from '#fe/pages/make/quiz-stats/quiz-stats-page'
import { ROUTES } from '#fe/urls.ts'

export const App = () => (
    <BrowserRouter>
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

            {/* Quiz taking (public) */}
            <Route path={ROUTES.quizWelcome} element={<QuizWelcomePage />} />
            <Route path={ROUTES.quizTake} element={<QuizTakePage />} />
        </Routes>
    </BrowserRouter>
)
