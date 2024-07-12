import { createContext, useState, type ReactNode } from "react"

export type ToastStatus = "success" | "failed" | "sent"

type Toast = {
  message: string | null
  status: ToastStatus | null
}

type ToastContextType = {
  toast: Toast
  setToast: (message: string, status: ToastStatus) => void
}

export const ToastContext = createContext<ToastContextType | null>(null)

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
