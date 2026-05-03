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
}: RobinAiHelperProps) =>
    createPortal(
        <>
            <div
                style={{
                    position: 'fixed',
                    bottom: '20px',
                    right: '20px',
                    zIndex: 9999,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                }}
            >
                <div
                    style={{
                        background: 'white',
                        color: '#7c3aed',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        whiteSpace: 'nowrap',
                    }}
                >
                    AI Helper
                </div>
                <button
                    type="button"
                    className="robin-button"
                    onClick={onOpen}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <img src={robinIcon} alt="Robin" className="robin-icon" style={{ width: '72px', height: '72px' }} />
                </button>
            </div>
            {open && (
                <div
                    style={{
                        position: 'fixed',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: '50vh',
                        background: 'white',
                        zIndex: 10000,
                        boxShadow: '0 -4px 24px rgba(0,0,0,0.18)',
                        borderRadius: '16px 16px 0 0',
                        display: 'flex',
                        flexDirection: 'column',
                        padding: '20px',
                        gap: '16px',
                        animation: 'slideUp 0.3s ease-out',
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 'bold', fontSize: '16px', color: '#7c3aed' }}>Ask Robin AI</span>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                background: 'none',
                                border: 'none',
                                fontSize: '20px',
                                cursor: 'pointer',
                                lineHeight: 1,
                                color: '#666',
                            }}
                        >
                            ✕
                        </button>
                    </div>
                    <TextArea
                        id="robin-prompt-text"
                        placeholder="What do you want to ask?"
                        value={promptText}
                        onChange={onPromptTextChange}
                    />
                    <span style={{ fontSize: '12px', color: '#888' }}>
                        Example: "What is the capital of France? Generate 6 answers."
                    </span>
                    {error && (
                        <Alert type="error" dataTestId="ai-assistant-error">
                            {error}
                        </Alert>
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
