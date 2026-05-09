interface QuestionCountInfoProps {
    readonly selectedCount: number
    readonly totalCount: number
}

export const QuestionCountInfo = ({ selectedCount, totalCount }: QuestionCountInfoProps) => (
    <>
        <div className="question-count-info">
            <span className="inline-label">
                <div className="bold-count" id="selected-question-count-for-quiz">
                    {selectedCount}
                </div>
                selected question(s)
            </span>
        </div>
        <div className="question-count-info">
            <span className="inline-label">
                <div className="bold-count" id="total-question-count-for-quiz">
                    {totalCount}
                </div>
                total questions available
            </span>
        </div>
    </>
)
