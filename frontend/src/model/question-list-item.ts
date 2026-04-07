export interface QuestionListItem {
    readonly id: number
    readonly question: string
    readonly isInAnyQuiz: boolean
    readonly imageUrl?: string
    readonly tags: string[]
}
