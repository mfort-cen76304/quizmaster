interface QuestionImageProps {
    readonly url: string
}

export const QuestionImage = ({ url }: QuestionImageProps) => (
    <img src={url} alt="question" className="question-image" />
)
