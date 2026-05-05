import type { QuestionType } from '#model/question.ts'
import type { QuestionDraft } from '#model/question.ts'
import { Alert, Button, Field, QuestionTypeRadioSet, TextArea } from '#pages/components'

import { useRobinPromptForm } from './use-robin-prompt-form.ts'
import type { RobinUndoBuffer } from './use-robin-undo-buffer.ts'

interface RobinSheetProps {
    readonly onGenerated: (drafts: readonly QuestionDraft[]) => void | Promise<void>
    readonly generateRequest?: (request: {
        question: string
        questionType: QuestionType
        workspaceGuid?: string
    }) => Promise<readonly QuestionDraft[]>
    readonly undo: RobinUndoBuffer
    readonly questionType: QuestionType
    readonly workspaceGuid?: string
    readonly onQuestionTypeChange: (type: QuestionType) => void
    readonly onClose: () => void
    readonly closeOnGenerated?: boolean
}

export const RobinSheet = ({
    onGenerated,
    generateRequest,
    undo,
    questionType,
    workspaceGuid,
    onQuestionTypeChange,
    onClose,
    closeOnGenerated,
}: RobinSheetProps) => {
    const { promptText, setPromptText, loading, error, generate } = useRobinPromptForm({
        onGenerated,
        generateRequest,
        undo,
        questionType,
        workspaceGuid,
        onClose,
        closeOnGenerated,
    })

    return (
        <div className="robin-sheet">
            <div className="header">
                <span className="title">Ask Robin AI</span>
                <button type="button" className="close-button" onClick={onClose}>
                    ✕
                </button>
            </div>
            <Field label="Question type" required>
                <QuestionTypeRadioSet name="robin-question-type" value={questionType} onChange={onQuestionTypeChange} />
            </Field>
            <TextArea
                id="robin-prompt-text"
                placeholder="What do you want to ask?"
                value={promptText}
                onChange={setPromptText}
            />
            <span className="example">Example: "What is the capital of France? Generate 6 answers."</span>
            {error && (
                <Alert type="error" dataTestId="ai-assistant-error">
                    {error}
                </Alert>
            )}
            {undo.hasPrevious && (
                <Button id="previous-version-button" className="secondary button" onClick={undo.restore}>
                    Previous version
                </Button>
            )}
            <Button
                id="robin-generate-button"
                className="secondary button"
                onClick={() => void generate()}
                disabled={loading}
            >
                {loading ? 'Loading...' : 'Generate'}
            </Button>
        </div>
    )
}
