type ButtonProps = {
  buttonText: string
  disabled: boolean
  onClick: () => void
  className?: string
}
export const Button = (props: ButtonProps) => {
  const { buttonText, disabled, onClick, className } = props
  return (
    <button className={className} disabled={disabled} onClick={onClick}>
      {buttonText}
    </button>
  )
}

