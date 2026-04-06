import { urls, useWorkspaceId } from '#fe/urls.ts'
import type { QuizListItem } from '#model/quiz-list-item'
import { LinkButton } from '#pages/components'

interface Props {
    readonly quiz: QuizListItem
    readonly onDeleteClick: (id: number) => void
}

export const QuizItem = ({ quiz, onDeleteClick }: Props) => {
    const workspaceId = useWorkspaceId()
    return (
        <div className="quiz-item question-item">
            <span className="question-text">{quiz.title}</span>
            <LinkButton label="Edit" to={urls.workspaceQuizEdit(workspaceId, quiz.id)} />
            <LinkButton label="Take" to={urls.quizWelcome(quiz.id)} />
            <LinkButton label="Statistics" to={urls.workspaceQuizStats(workspaceId, quiz.id)} />
            <button type="button" className="link-button" onClick={() => onDeleteClick(quiz.id)}>
                Delete
            </button>
        </div>
    )
}
