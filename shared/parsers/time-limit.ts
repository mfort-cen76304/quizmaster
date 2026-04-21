// Same grammar as the quiz-form time-limit input: "60s", "5m", "2m30s", "30s2m".
// Returns NaN for unparseable input; callers decide how to handle that.
export const parseTimeLimitToSeconds = (value: string): number => {
    const minutesAndSeconds = value.match(/^(\d+)m(\d+)s$/i)
    if (minutesAndSeconds) {
        return Number(minutesAndSeconds[1]) * 60 + Number(minutesAndSeconds[2])
    }

    const secondsAndMinutes = value.match(/^(\d+)s(\d+)m$/i)
    if (secondsAndMinutes) {
        return Number(secondsAndMinutes[1]) + Number(secondsAndMinutes[2]) * 60
    }

    const onlyMinutes = value.match(/^(\d+)m$/i)
    if (onlyMinutes) {
        return Number(onlyMinutes[1]) * 60
    }

    const onlySeconds = value.match(/^(\d+)s$/i)
    if (onlySeconds) {
        return Number(onlySeconds[1])
    }

    return Number.NaN
}
