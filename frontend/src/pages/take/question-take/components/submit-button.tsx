interface SubmitButtonProps {
    readonly disabled: boolean
}

export const SubmitButton = ({ disabled }: SubmitButtonProps) => (
    <input type="submit" value="Submit" className="submit-btn" disabled={disabled} />
)
