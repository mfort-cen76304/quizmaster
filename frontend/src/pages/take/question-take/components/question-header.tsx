import { stripTag } from '../question-display.ts'

interface QuestionHeaderProps {
    readonly text: string
}

export const QuestionHeader = ({ text }: QuestionHeaderProps) => <h1 id="question">{stripTag(text)}</h1>
