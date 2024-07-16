import { createContext, useState, type ReactNode } from "react"

import { useAccount, useTokens } from "~app/storage"
import { getChainName } from "~packages/network/util"
import type { Token } from "~storage/local/state"
import type { Nullable } from "~typing"

type SendTokenContextType = {
  tokens: Token[]
  tokenSelected: Nullable<Token>
  setTokenSelected: (token: Token) => void
  step: number
  setStep: (step: number) => void
}

export const SendTokenContext =
  createContext<Nullable<SendTokenContextType>>(null)

export const SendTokenProvider = ({ children }: { children: ReactNode }) => {
  const account = useAccount()
  const nativeToken = {
    address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
    symbol: `${getChainName(account.chainId)}ETH`,
    decimals: 18,
    balance: account.balance
  }
  const tokens = [nativeToken, ...useTokens()]
  const [tokenSelected, setTokenSelected] = useState<Nullable<Token>>(null)
  const [step, setStep] = useState<number>(0)

  return (
    <SendTokenContext.Provider
      value={{
        tokens,
        tokenSelected,
        setTokenSelected,
        step,
        setStep
      }}>
      {children}
    </SendTokenContext.Provider>
  )
}
