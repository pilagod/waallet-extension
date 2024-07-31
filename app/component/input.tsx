import { type ChangeEvent } from "react"

export function Input(props: {
  value: string
  name?: string
  label?: string
  disabled?: boolean
  placeholder?: string
  required?: boolean
  onValueChanged?: (v: string) => void
}) {
  return (
    <div>
      {props.label && <div className="mb-[8px] text-[16px]">{props.label}</div>}
      <input
        type="text"
        name={props.name} // To improve auto-complete support
        value={props.value}
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          props.onValueChanged(e.target.value)
        }
        className={`w-full border-solid border-[2px] rounded-[16px] p-[16px] text-[16px] ${
          props.disabled ? "border-[#BBBBBB] text-[#BBBBBB]" : "border-black"
        }`}
        disabled={props.disabled}
        placeholder={props.placeholder}
        required={props.required}
      />
    </div>
  )
}
