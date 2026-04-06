import React from 'react'

interface Props {
    enabled: boolean
    onDigitPressed: (idx: number) => void
    onEnterPressed: () => void
}

export const useQuestionKeyboardShortcuts = ({ enabled, onDigitPressed, onEnterPressed }: Props): void => {
    React.useEffect(() => {
        if (!enabled) return

        const isDigitKey = (code: string) => /^(Numpad|Digit)[0-9]$/.test(code)
        const answerIdx = (code: string) => Number(code.slice(-1)) - 1

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Enter') {
                onEnterPressed()
            } else if (isDigitKey(e.code)) {
                onDigitPressed(answerIdx(e.code))
            }
        }

        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
    }, [enabled, onDigitPressed, onEnterPressed])
}
