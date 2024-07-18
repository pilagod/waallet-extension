import { createContext, useState, type ReactNode } from "react"

import type { Token } from "~storage/local/state"
import type { Nullable } from "~typing"

type SendTokenContextType = {
  tokenSelected: Nullable<Token>
  setTokenSelected: (token: Token) => void
  step: number
  setStep: (step: number) => void
}

export const SendTokenContext =
  createContext<Nullable<SendTokenContextType>>(null)

export const SendTokenProvider = ({ children }: { children: ReactNode }) => {
  const [tokenSelected, setTokenSelected] = useState<Nullable<Token>>(null)
  const [step, setStep] = useState<number>(0)

  return (
    <SendTokenContext.Provider
      value={{
        tokenSelected,
        setTokenSelected,
        step,
        setStep
      }}>
      {children}
    </SendTokenContext.Provider>
  )
}
