import { createContext, useState, type ReactNode } from "react"

import type { Nullable } from "~typing"

export type ToastStatus = "success" | "failed" | "sent" | "copy"

type Toast = {
  message: Nullable<string>
  status: Nullable<ToastStatus>
}

type ToastContextType = {
  toast: Toast
  setToast: (message: string, status: ToastStatus) => void
}

export const ToastContext = createContext<Nullable<ToastContextType>>(null)

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toast, setToastState] = useState<Toast>({
    message: null,
    status: null
  })

  const setToast = (message: string, status: ToastStatus) => {
    setToastState({ message, status })
  }

  return (
    <ToastContext.Provider value={{ toast, setToast }}>
      {children}
    </ToastContext.Provider>
  )
}
