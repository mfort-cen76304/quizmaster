import './checkbox.scss'

interface CheckboxProps {
    readonly id?: string
    readonly checked: boolean
    readonly disabled?: boolean
    readonly onToggle: (value: boolean) => void
}

export const Checkbox = ({ id, checked, disabled, onToggle }: CheckboxProps) => (
    <input type="checkbox" id={id} checked={checked} disabled={disabled} onChange={e => onToggle(e.target.checked)} />
)

interface CheckFieldProps extends CheckboxProps {
    readonly label: string
}

export const CheckField = ({ id, label, checked, disabled, onToggle }: CheckFieldProps) => (
    <label className="check">
        <Checkbox id={id} checked={checked} disabled={disabled} onToggle={onToggle} /> {label}
    </label>
)
