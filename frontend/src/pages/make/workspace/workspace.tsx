import './workspace.scss'
import { useState } from 'react'

import { useApi } from '#api/hooks.ts'
import { deleteQuestion } from '#api/question.ts'
import { deleteQuiz } from '#api/quiz.ts'
import { fetchWorkspace, fetchWorkspaceQuestions, fetchWorkspaceQuizzes } from '#api/workspace.ts'
import { urls, useWorkspaceId } from '#fe/urls.ts'
import type { QuestionListItem } from '#model/question-list-item.ts'
import type { QuizListItem } from '#model/quiz-list-item.ts'
import type { Workspace } from '#model/workspace.ts'
import { ItemList, LinkButton } from '#pages/components'

import { QuestionItem } from './question-item.tsx'
import { QuizItem } from './quiz-item.tsx'
import { WorkspaceRobinAiHelper } from './workspace-robin-ai-helper.tsx'

export function WorkspacePage() {
    const workspaceId = useWorkspaceId()

    const [workspace, setWorkspace] = useState<Workspace>({ guid: workspaceId, title: '' })
    const [questions, setQuestions] = useState<readonly QuestionListItem[]>([])
    const [quizzes, setQuizzes] = useState<readonly QuizListItem[]>([])
    const [quizToDelete, setQuizToDelete] = useState<{ id: number; title: string } | null>(null)

    useApi(workspaceId, fetchWorkspace, setWorkspace)
    const refreshQuestions = useApi(workspaceId, fetchWorkspaceQuestions, setQuestions)
    useApi(workspaceId, fetchWorkspaceQuizzes, setQuizzes)

    const onDeleteQuestion = async (id: number) => {
        await deleteQuestion(workspaceId, String(id))
        setQuestions(await fetchWorkspaceQuestions(workspaceId))
    }

    const onConfirmDeleteQuiz = async () => {
        if (!quizToDelete) return
        await deleteQuiz(workspaceId, String(quizToDelete.id))
        setQuizToDelete(null)
        setQuizzes(await fetchWorkspaceQuizzes(workspaceId))
        setQuestions(await fetchWorkspaceQuestions(workspaceId))
    }

    const hasQuestions = questions.length > 0
    const hasAtLeastTwoQuestions = questions.length >= 2
    const hasQuizzes = quizzes.length > 0

    return (
        <div className="workspace-page">
            <WorkspaceRobinAiHelper workspaceId={workspaceId} onQuestionsSaved={refreshQuestions} />
            <section className="workspace-header">
                <div className="workspace-header__content">
                    <div className="workspace-header__eyebrow">Welcome to your workspace!</div>
                    {workspace.title && <h1 data-testid="workspace-title">{workspace.title}</h1>}
                    <p className="workspace-header__copy">Build your question bank here, then assemble quizzes!</p>
                </div>
                <div className="workspace-header__stats" aria-label="Workspace summary">
                    <div className="workspace-header__stat">
                        <strong>{questions.length}</strong>
                        <span>{questions.length === 1 ? 'question' : 'questions'}</span>
                    </div>
                    <div className="workspace-header__stat">
                        <strong>{quizzes.length}</strong>
                        <span>{quizzes.length === 1 ? 'quiz' : 'quizzes'}</span>
                    </div>
                </div>
            </section>

            <div className="create-buttons">
                <LinkButton
                    label="Create Question"
                    id="create-question"
                    to={urls.workspaceQuestionNew(workspace.guid)}
                />
                <LinkButton label="Create Quiz" id="create-quiz" to={urls.workspaceQuizNew(workspace.guid)} />
            </div>

            <ItemList title="My Questions">
                {hasQuestions ? (
                    questions.map((q, index) => (
                        <QuestionItem
                            key={q.id || index}
                            question={q}
                            index={index}
                            onDeleteQuestion={() => onDeleteQuestion(q.id)}
                        />
                    ))
                ) : (
                    <div className="workspace-empty-state workspace-empty-state--questions">
                        <h3>Create your first question</h3>
                        <p>Every quiz starts with a solid question bank. AI will help you to prepare perfect drafts!</p>
                    </div>
                )}
            </ItemList>

            <ItemList title="My Quizzes">
                {hasQuizzes ? (
                    quizzes.map(quiz => (
                        <QuizItem
                            key={quiz.id}
                            quiz={quiz}
                            onDeleteClick={q => setQuizToDelete({ id: q, title: quiz.title })}
                        />
                    ))
                ) : (
                    <div className="workspace-empty-state workspace-empty-state--quizzes">
                        <h3>{hasAtLeastTwoQuestions ? 'Turn questions into a quiz' : 'Quizzes will appear here'}</h3>
                        <p>
                            {hasAtLeastTwoQuestions
                                ? 'You already have enough questions to work with. Group them into a quiz!'
                                : 'Once you have at least 2 questions in place, you can package them into quizzes!'}
                        </p>
                    </div>
                )}
            </ItemList>
            {quizToDelete && (
                <dialog open>
                    <p>Delete quiz &quot;{quizToDelete.title}&quot;?</p>
                    <button type="button" onClick={onConfirmDeleteQuiz}>
                        Confirm
                    </button>
                    <button type="button" onClick={() => setQuizToDelete(null)}>
                        Cancel
                    </button>
                </dialog>
            )}
        </div>
    )
}
