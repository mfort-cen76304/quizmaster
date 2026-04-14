import './page.scss'

interface PageProps {
    readonly id?: string
    readonly title: string
    readonly subtitle?: string
    readonly eyebrow?: string
    readonly children: React.ReactNode
}

export const Page = ({ id, title, subtitle, eyebrow, children }: PageProps) => (
    <div id={id} className="page">
        <div className="page__header">
            {eyebrow && <div className="page__eyebrow">{eyebrow}</div>}
            <h1>{title}</h1>
            {subtitle && <p className="page__subtitle">{subtitle}</p>}
        </div>
        {children}
    </div>
)
