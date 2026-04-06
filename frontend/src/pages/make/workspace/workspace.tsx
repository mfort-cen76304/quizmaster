import './workspace.scss'
import { useState } from 'react'

import { useApi } from '#api/hooks'
import { deleteQuestion } from '#api/question'
import { deleteQuiz } from '#api/quiz'
import { fetchWorkspace, fetchWorkspaceQuestions, fetchWorkspaceQuizzes } from '#api/workspace'
import { urls, useWorkspaceId } from '#fe/urls.ts'
import type { QuestionListItem } from '#model/question-list-item'
import type { QuizListItem } from '#model/quiz-list-item'
import type { Workspace } from '#model/workspace'
import { ItemList, LinkButton } from '#pages/components'

import { QuestionItem } from './question-item'
import { QuizItem } from './quiz-item'

export function WorkspacePage() {
    const workspaceId = useWorkspaceId()

    const [workspace, setWorkspace] = useState<Workspace>({ guid: workspaceId, title: '' })
    const [questions, setQuestions] = useState<readonly QuestionListItem[]>([])
    const [quizzes, setQuizzes] = useState<readonly QuizListItem[]>([])
    const [quizToDelete, setQuizToDelete] = useState<{ id: number; title: string } | null>(null)

    useApi(workspaceId, fetchWorkspace, setWorkspace)
    useApi(workspaceId, fetchWorkspaceQuestions, setQuestions)
    useApi(workspaceId, fetchWorkspaceQuizzes, setQuizzes)

    const onDeleteQuestion = async (id: number) => {
        await deleteQuestion(workspaceId, `${id}`)
        setQuestions(await fetchWorkspaceQuestions(workspaceId))
    }

    const onConfirmDeleteQuiz = async () => {
        if (!quizToDelete) return
        await deleteQuiz(workspaceId, `${quizToDelete.id}`)
        setQuizToDelete(null)
        setQuizzes(await fetchWorkspaceQuizzes(workspaceId))
        setQuestions(await fetchWorkspaceQuestions(workspaceId))
    }

    return (
        <div className="workspace-page">
            {workspace.title && <h1 data-testid="workspace-title">{workspace.title}</h1>}
            <div className="create-buttons">
                <LinkButton
                    label="Create Question"
                    id="create-question"
                    to={urls.workspaceQuestionNew(workspace.guid)}
                />
                <LinkButton label="Create Quiz" id="create-quiz" to={urls.workspaceQuizNew(workspace.guid)} />
            </div>
            <ItemList title="My Questions">
                {questions.map((q, index) => (
                    <QuestionItem
                        key={q.id || index}
                        question={q}
                        index={index}
                        onDeleteQuestion={() => onDeleteQuestion(q.id)}
                    />
                ))}
            </ItemList>
            <ItemList title="My quizzes">
                {quizzes.map(quiz => (
                    <QuizItem
                        key={quiz.id}
                        quiz={quiz}
                        onDeleteClick={q => setQuizToDelete({ id: q, title: quiz.title })}
                    />
                ))}
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
