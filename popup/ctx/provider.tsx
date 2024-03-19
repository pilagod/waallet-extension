import * as ethers from "ethers"
import { createContext, useContext, type ReactNode } from "react"
import { useShallow } from "zustand/react/shallow"

import { BackgroundDirectMessenger } from "~packages/messenger/background/direct"
import { WaalletContentProvider } from "~packages/waallet/content/provider"
import { useStorage } from "~popup/storage"

export const ProviderContext = createContext<{
  provider: ethers.BrowserProvider
}>({
  provider: null
})

export function ProviderCtxProvider({ children }: { children: ReactNode }) {
  const network = useStorage(
    useShallow((storage) => storage.state?.network[storage.state.networkActive])
  )
  if (!network) {
    return <></>
  }
  const provider = new ethers.BrowserProvider(
    new WaalletContentProvider(new BackgroundDirectMessenger())
  )
  return (
    <ProviderContext.Provider
      value={{
        provider
      }}>
      {children}
    </ProviderContext.Provider>
  )
}

export const useProvider = () => {
  return useContext(ProviderContext)
}
