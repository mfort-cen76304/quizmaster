import { Link } from 'react-router'
import './page.scss'

interface PageProps {
    readonly id?: string
    readonly title: string
    readonly subtitle?: string
    readonly back?: { to: string; label?: string }
    readonly children: React.ReactNode
}

export const Page = ({ id, title, subtitle, back, children }: PageProps) => (
    <div id={id} className="page">
        <div className="page__header">
            {back && (
                <Link id="back" to={back.to} className="page__back">
                    ← {back.label ?? 'Back'}
                </Link>
            )}
            <h1>{title}</h1>
            {subtitle && <p className="page__subtitle">{subtitle}</p>}
        </div>
        {children}
    </div>
)
