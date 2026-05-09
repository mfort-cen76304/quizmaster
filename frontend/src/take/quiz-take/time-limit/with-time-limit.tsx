import { useState } from 'react'

import { Countdown } from './countdown.tsx'
import { TimeOutReachedModal } from './timeout-reached-modal.tsx'

interface TimeLimitProps {
    readonly timeLimit: number
    readonly onTimeOut: () => Promise<void> | void
    readonly onConfirm: () => void
}

export const TimeLimit = ({ timeLimit, onTimeOut, onConfirm }: TimeLimitProps) => {
    const [timeoutReached, setTimeoutReached] = useState(false)

    const handleTimeLimit = async () => {
        await onTimeOut()
        setTimeoutReached(true)
    }

    return (
        <div>
            <Countdown timeLimit={timeLimit} onTimeLimit={handleTimeLimit} />
            {timeoutReached && <TimeOutReachedModal onConfirm={onConfirm} />}
        </div>
    )
}
