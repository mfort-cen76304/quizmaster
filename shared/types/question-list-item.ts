import type { QuestionStats } from './question-stats';

export interface QuestionListItem {
    readonly id: number;
    readonly question: string;
    readonly isInAnyQuiz: boolean;
    readonly imageUrl?: string;
    readonly tags: string[];
    readonly stats?: QuestionStats;
}
