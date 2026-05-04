import { createPortal } from 'react-dom'

import robinIcon from '#fe/assets/icons/Robin.svg'
import { Alert, Button, TextArea } from '#pages/components'
import './robin-ai.scss'

interface RobinAiHelperProps {
    readonly open: boolean
    readonly onOpen: () => void
    readonly onClose: () => void
    readonly promptText: string
    readonly onPromptTextChange: (value: string) => void
    readonly onGenerate: () => void
    readonly loading: boolean
    readonly error: string
    readonly hasPreviousVersion: boolean
    readonly onRestorePreviousVersion: () => void
}

export const RobinAiHelper = ({
    open,
    onOpen,
    onClose,
    promptText,
    onPromptTextChange,
    onGenerate,
    loading,
    error,
    hasPreviousVersion,
    onRestorePreviousVersion,
}: RobinAiHelperProps) =>
    createPortal(
        <>
            <div className="robin-fab">
                <div className="tooltip">AI Helper</div>
                <button type="button" className="trigger" onClick={onOpen}>
                    <img src={robinIcon} alt="Robin" className="icon" />
                </button>
            </div>
            {open && (
                <div className="robin-sheet">
                    <div className="header">
                        <span className="title">Ask Robin AI</span>
                        <button type="button" className="close-button" onClick={onClose}>
                            ✕
                        </button>
                    </div>
                    <TextArea
                        id="robin-prompt-text"
                        placeholder="What do you want to ask?"
                        value={promptText}
                        onChange={onPromptTextChange}
                    />
                    <span className="example">Example: "What is the capital of France? Generate 6 answers."</span>
                    {error && (
                        <Alert type="error" dataTestId="ai-assistant-error">
                            {error}
                        </Alert>
                    )}
                    {hasPreviousVersion && (
                        <Button
                            id="previous-version-button"
                            className="secondary button"
                            onClick={onRestorePreviousVersion}
                        >
                            Previous version
                        </Button>
                    )}
                    <Button
                        id="robin-generate-button"
                        className="secondary button"
                        onClick={onGenerate}
                        disabled={loading}
                    >
                        {loading ? 'Loading...' : 'Generate'}
                    </Button>
                </div>
            )}
        </>,
        document.body,
    )
