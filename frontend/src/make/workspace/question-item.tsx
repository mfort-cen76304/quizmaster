import type { QuestionListItem } from '#fe/make/model/question-list-item.ts'
import { tagToColor } from '#fe/make/model/tag.ts'
import { Button, LinkButton } from '#fe/shared'
import { urls, useWorkspaceId } from '#fe/urls.ts'

interface Props {
    readonly question: QuestionListItem
    readonly index: number
    readonly onDeleteQuestion: () => void
}

export const QuestionItem = ({ question, index, onDeleteQuestion }: Props) => {
    const workspaceId = useWorkspaceId()
    return (
        <div className="question-item">
            {question.imageUrl && <img src={question.imageUrl} alt="" className="question-thumbnail" />}
            <div className="question-content">
                <span className="question-index">Q{index + 1}.</span>
                {question.tags.length > 0 && (
                    <div className="question-tag-row">
                        {question.tags.map(tag => (
                            <span key={tag} className="question-tag-badge" style={{ background: tagToColor(tag) }}>
                                {tag}
                            </span>
                        ))}
                    </div>
                )}
                <div className="question-main-row">
                    <span className="question-text">{question.question}</span>
                    <LinkButton label="Edit" to={urls.workspaceQuestionEdit(workspaceId, question.id)} />
                    <LinkButton label="Take" to={urls.questionTake(question.id)} />
                    {!question.isInAnyQuiz && (
                        <Button className="link-button" onClick={onDeleteQuestion}>
                            Delete
                        </Button>
                    )}
                </div>
                {question.stats && (
                    <div className="question-stats-row">
                        <span className="question-stat">
                            <span className="question-stat__label">Asked</span>
                            <span className="question-stat__value">Asked: {question.stats.timesAsked}×</span>
                        </span>
                        <span className="question-stat">
                            <span className="question-stat__label">Success</span>
                            <span className="question-stat__value">Success: {question.stats.successRate}%</span>
                        </span>
                        <span className="question-stat">
                            <span className="question-stat__label">Avg time</span>
                            <span className="question-stat__value">Avg time: {question.stats.averageTime}s</span>
                        </span>
                        <span className="question-stat">
                            <span className="question-stat__label">Skipped</span>
                            <span className="question-stat__value">Skipped: {question.stats.skipped}×</span>
                        </span>
                    </div>
                )}
            </div>
        </div>
    )
}
