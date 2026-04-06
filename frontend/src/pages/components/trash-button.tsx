import trashIcon from '#fe/assets/icons/trash-delete-bin.svg'

import { Button } from './button.tsx'
import './trash-button.scss'

type TrashButtonProps = {
    onClick: () => void
    disabled?: boolean
}

const TrashButton = ({ onClick, disabled }: TrashButtonProps) => (
    <Button className="trash-button" onClick={onClick} disabled={disabled}>
        <img src={trashIcon} alt="Delete" width="20" height="20" />
    </Button>
)

export default TrashButton
