import { urls, useWorkspaceId } from '#fe/urls.ts'
import type { QuestionListItem } from '#model/question-list-item'
import { parseTag, tagToColor } from '#model/tag.ts'
import { Button, LinkButton } from '#pages/components'

interface Props {
    readonly question: QuestionListItem
    readonly index: number
    readonly onDeleteQuestion: () => void
}

export const QuestionItem = ({ question, index, onDeleteQuestion }: Props) => {
    const workspaceId = useWorkspaceId()
    const { tag, title } = parseTag(question.question)
    return (
        <div className="question-item">
            {question.imageUrl && <img src={question.imageUrl} alt="" className="question-thumbnail" />}
            <div className="question-content">
                <span className="question-index">Q{index + 1}.</span>
                {tag && (
                    <div className="question-tag-row">
                        <span className="question-tag-badge" style={{ background: tagToColor(tag) }}>
                            {tag}
                        </span>
                    </div>
                )}
                <div className="question-main-row">
                    <span className="question-text">{title}</span>
                    <LinkButton label="Edit" to={urls.workspaceQuestionEdit(workspaceId, question.id)} />
                    <LinkButton label="Take" to={urls.questionTake(question.id)} />
                    {!question.isInAnyQuiz && (
                        <Button className="link-button" onClick={onDeleteQuestion}>
                            Delete
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}
