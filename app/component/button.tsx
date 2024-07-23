type ButtonProps = {
  text: string
  variant: "black" | "white"
  disabled?: boolean
  onClick?: () => void
  className?: string
}
export const Button = (props: ButtonProps) => {
  const { text, disabled = false, onClick, variant, className } = props
  const baseClass =
    "font-bold border border-solid border-black p-[17px] rounded-full w-full"
  const variantClass =
    variant === "black"
      ? "bg-black text-white hover:text-[#989898]"
      : "bg-white text-black"
  const disabledClass = "bg-[#BBBBBB] text-white border-none"
  return (
    <button
      className={`${baseClass} ${
        disabled ? disabledClass : variantClass
      } ${className}`}
      disabled={disabled}
      onClick={onClick}>
      {text}
    </button>
  )
}
