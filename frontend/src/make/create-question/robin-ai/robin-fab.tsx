import robinIcon from '#fe/assets/icons/Robin.svg'

interface RobinFabProps {
    readonly onOpen: () => void
}

export const RobinFab = ({ onOpen }: RobinFabProps) => (
    <div className="robin-fab">
        <div className="tooltip">AI Helper</div>
        <button type="button" className="trigger" onClick={onOpen}>
            <img src={robinIcon} alt="Robin" className="icon" />
        </button>
    </div>
)
