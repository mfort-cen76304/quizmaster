interface QuestionHeaderProps {
    readonly text: string
}

export const QuestionHeader = ({ text }: QuestionHeaderProps) => <h1 id="question">{text}</h1>
