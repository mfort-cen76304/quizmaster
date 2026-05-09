import { useEffect, useRef, useState } from 'react'
import './countdown.scss'

interface CountdownProps {
    readonly timeLimit: number
    readonly onTimeLimit: () => void
}

const LOW_TIME_THRESHOLD_MS = 60_000

export const Countdown = ({ onTimeLimit, timeLimit }: CountdownProps) => {
    const durationMs = (timeLimit || 120) * 1000

    const [timeLeft, setTimeLeft] = useState(durationMs)
    const endTimeRef = useRef(Date.now() + durationMs)
    const onTimeLimitRef = useRef(onTimeLimit)
    const timeoutTriggeredRef = useRef(false)

    useEffect(() => {
        onTimeLimitRef.current = onTimeLimit
    }, [onTimeLimit])

    useEffect(() => {
        endTimeRef.current = Date.now() + durationMs
        timeoutTriggeredRef.current = false
        setTimeLeft(durationMs)
    }, [durationMs])

    useEffect(() => {
        const interval = setInterval(() => {
            const next = Math.max(0, endTimeRef.current - Date.now())
            setTimeLeft(next)

            if (next <= 0) {
                clearInterval(interval)
                if (!timeoutTriggeredRef.current) {
                    timeoutTriggeredRef.current = true
                    onTimeLimitRef.current()
                }
            }
        }, 250)
        return () => clearInterval(interval)
    }, [durationMs])

    const minutes = Math.floor(timeLeft / 60000)
    const seconds = Math.floor((timeLeft % 60000) / 1000)
    const formatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    const isLow = timeLeft > 0 && timeLeft < LOW_TIME_THRESHOLD_MS

    return (
        <div className={`countdown${isLow ? ' is-low' : ''}`}>
            <span className="label">Time left</span>
            <span className="value" data-testid="timerID">
                {formatted}
            </span>
        </div>
    )
}
