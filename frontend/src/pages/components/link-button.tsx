import { Link } from 'react-router'
import './link-button.scss'

interface LinkButtonProps {
    readonly label: string
    readonly id?: string
    readonly className?: string
    readonly to: string
}

export const LinkButton = ({ label, id, className, to }: LinkButtonProps) => (
    <Link id={id} className={`link-button${className ? ` ${className}` : ''}`} to={to}>
        {label}
    </Link>
)
