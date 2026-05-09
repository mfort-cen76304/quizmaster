import './take-card.scss'

interface TakeCardProps {
    readonly id?: string
    readonly className?: string
    readonly children: React.ReactNode
}

export const TakeCard = ({ id, className, children }: TakeCardProps) => (
    <section id={id} className={`take-card${className ? ` ${className}` : ''}`}>
        {children}
    </section>
)
