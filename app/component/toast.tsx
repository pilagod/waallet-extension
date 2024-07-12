import { useContext, useEffect } from "react"
import Failed from "react:~assets/failed.svg"
import Sent from "react:~assets/sent.svg"
import Success from "react:~assets/success.svg"

import { ToastContext, type ToastStatus } from "~app/context/toastContext"

const statusIcon: Record<ToastStatus, JSX.Element> = {
  success: <Success />,
  failed: <Failed />,
  sent: <Sent />
}

const statusTextColor: Record<ToastStatus, string> = {
  success: "text-[#7FFF9C]",
  failed: "text-[#FF9393]",
  sent: "text-[#7EE0FF]"
}
export const Toast = () => {
  const { toast, setToast } = useContext(ToastContext)
  const { status, message } = toast

  useEffect(() => {
    if (toast && toast.message && toast.status) {
      const timer = setTimeout(() => {
        setToast(null, null)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [toast, setToast])

  if (!status || !message) {
    return
  }

  return (
    <div className="absolute w-[358px] top-[32px] flex gap-[8px] items-center bg-black rounded-2xl p-[16px] shadow-[4px_8px_0px_0px_rgba(0,0,0,0.16)]">
      {statusIcon[status]}
      <span className={`text-[16px] ${statusTextColor[status]}`}>
        {message}
      </span>
    </div>
  )
}
