import React from 'react'

interface Props {
    enabled: boolean
    onDigitPressed: (idx: number) => void
    onEnterPressed: () => void
}

export const useQuestionKeyboardShortcuts = ({ enabled, onDigitPressed, onEnterPressed }: Props): void => {
    const onDigitPressedRef = React.useRef(onDigitPressed)
    const onEnterPressedRef = React.useRef(onEnterPressed)

    React.useEffect(() => {
        onDigitPressedRef.current = onDigitPressed
        onEnterPressedRef.current = onEnterPressed
    }, [onDigitPressed, onEnterPressed])

    React.useEffect(() => {
        if (!enabled) return

        const isDigitKey = (code: string) => /^(Numpad|Digit)[0-9]$/.test(code)
        const answerIdx = (code: string) => Number(code.slice(-1)) - 1

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Enter') {
                onEnterPressedRef.current()
            } else if (isDigitKey(e.code)) {
                onDigitPressedRef.current(answerIdx(e.code))
            }
        }

        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
    }, [enabled])
}
