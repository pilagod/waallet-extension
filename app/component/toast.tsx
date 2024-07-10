import Failed from "react:~assets/failed.svg"
import Submit from "react:~assets/submit.svg"
import Success from "react:~assets/success.svg"

type ToastProps = {
  status: "success" | "failed" | "submit"
  message: string
}

const statusIcon: Record<ToastProps["status"], JSX.Element> = {
  success: <Success />,
  failed: <Failed />,
  submit: <Submit />
}

const statusTextColor: Record<ToastProps["status"], string> = {
  success: "text-[#7FFF9C]",
  failed: "text-[#FF9393]",
  submit: "text-[#7EE0FF]"
}
export const Toast = (props: ToastProps) => {
  const { status, message } = props
  return (
    <div className="absolute w-[358px] top-[32px] flex gap-[8px] items-center bg-black rounded-2xl p-[16px] shadow-[4px_8px_0px_0px_rgba(0,0,0,0.16)]">
      {statusIcon[status]}
      <span className={`text-[16px] ${statusTextColor[status]}`}>
        {message}
      </span>
    </div>
  )
}
