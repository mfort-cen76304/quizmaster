export function formatTimeLimit(timeLimit: number) {
    if (timeLimit === undefined || timeLimit === null || Number.isNaN(timeLimit)) {
        return 'Not valid format'
    }
    const hours = Math.floor(timeLimit / 3600)
    const minutes = Math.floor((timeLimit % 3600) / 60)
    const seconds = timeLimit % 60
    return `${hours}h ${minutes}m ${seconds}s`
}
