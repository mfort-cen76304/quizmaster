import { createPortal } from 'react-dom'

import robinIcon from '#fe/assets/icons/Robin.svg'
import { Alert, Button, Field, QuestionTypeRadioSet, TextArea } from '#pages/components'
import './robin-ai.scss'
import { type RobinFormBinding, useRobinAi } from './use-robin-ai.ts'

interface RobinAiHelperProps {
    readonly form: RobinFormBinding
}

export const RobinAiHelper = ({ form }: RobinAiHelperProps) => {
    const state = useRobinAi(form)

    return createPortal(
        <>
            <div className="robin-fab">
                <div className="tooltip">AI Helper</div>
                <button type="button" className="trigger" onClick={state.open}>
                    <img src={robinIcon} alt="Robin" className="icon" />
                </button>
            </div>
            {state.sheetOpen && (
                <div className="robin-sheet">
                    <div className="header">
                        <span className="title">Ask Robin AI</span>
                        <button type="button" className="close-button" onClick={state.close}>
                            ✕
                        </button>
                    </div>
                    <Field label="Question type" required>
                        <QuestionTypeRadioSet
                            name="robin-question-type"
                            value={state.questionType}
                            onChange={state.setQuestionType}
                        />
                    </Field>
                    <TextArea
                        id="robin-prompt-text"
                        placeholder="What do you want to ask?"
                        value={state.promptText}
                        onChange={state.setPromptText}
                    />
                    <span className="example">Example: "What is the capital of France? Generate 6 answers."</span>
                    {state.error && (
                        <Alert type="error" dataTestId="ai-assistant-error">
                            {state.error}
                        </Alert>
                    )}
                    {state.hasPreviousVersion && (
                        <Button
                            id="previous-version-button"
                            className="secondary button"
                            onClick={state.restorePreviousVersion}
                        >
                            Previous version
                        </Button>
                    )}
                    <Button
                        id="robin-generate-button"
                        className="secondary button"
                        onClick={() => void state.generate()}
                        disabled={state.loading}
                    >
                        {state.loading ? 'Loading...' : 'Generate'}
                    </Button>
                </div>
            )}
        </>,
        document.body,
    )
}
