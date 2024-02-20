import { type BrowserProvider } from "ethers"
import * as ethers from "ethers"
import {
  createContext,
  useContext,
  useState,
  type Dispatch,
  type FunctionComponent,
  type ReactNode,
  type SetStateAction
} from "react"

import { BackgroundDirectMessenger } from "~packages/messenger/background/direct"
import { WaalletContentProvider } from "~packages/provider/waallet/content/provider"

type ProviderCtxInterface = {
  provider: BrowserProvider
  setProvider: Dispatch<SetStateAction<BrowserProvider>>
  index: number
  setIndex: Dispatch<SetStateAction<number>>
}

export const ProviderCtx = createContext<ProviderCtxInterface>({
  provider: null,
  setProvider: () => {},
  index: 0,
  setIndex: () => {}
})

export const ProviderCtxProvider: FunctionComponent<{
  children: ReactNode
}> = ({ children }) => {
  const [provider, setProvider] = useState<BrowserProvider | null>(
    new ethers.BrowserProvider(
      new WaalletContentProvider(new BackgroundDirectMessenger())
    )
  )
  const [index, setIndex] = useState<number>(0)

  const account: ProviderCtxInterface = {
    provider,
    setProvider,
    index,
    setIndex
  }

  return <ProviderCtx.Provider value={account}>{children}</ProviderCtx.Provider>
}

export const useProvider = () => {
  return useContext(ProviderCtx)
}
