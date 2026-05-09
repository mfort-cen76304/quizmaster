import './question-select.scss'
import type { QuestionListItem } from '#fe/make/model/question-list-item.ts'
import { tagToColor } from '#fe/make/model/tag.ts'

interface QuestionItemProps {
    readonly question: QuestionListItem
    readonly selected: boolean
    readonly onSelect: (id: number) => void
}

export const QuestionItem = ({ question, selected, onSelect }: QuestionItemProps) => {
    const inputId = `question-select-${question.id}`

    return (
        <div key={question.id} className="question-item">
            {question.tags.length > 0 && (
                <div className="question-tag-row">
                    {question.tags.map(tag => (
                        <span key={tag} className="question-tag-badge" style={{ background: tagToColor(tag) }}>
                            {tag}
                        </span>
                    ))}
                </div>
            )}
            <input id={inputId} type="checkbox" checked={selected} onChange={() => onSelect(question.id)} />
            <label htmlFor={inputId}>{question.question}</label>
        </div>
    )
}

interface QuestionSelectProps {
    readonly questions: readonly QuestionListItem[]
    readonly selectedIds: ReadonlySet<number>
    readonly onSelect: (id: number) => void
}

export const QuestionSelect = ({ questions, selectedIds, onSelect }: QuestionSelectProps) => (
    <div className="question-select">
        {questions.map(question => (
            <QuestionItem
                key={question.id}
                question={question}
                selected={selectedIds.has(question.id)}
                onSelect={onSelect}
            />
        ))}
    </div>
)
