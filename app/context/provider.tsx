import * as ethers from "ethers"
import { createContext, useContext, type ReactNode } from "react"

import { BackgroundDirectMessenger } from "~packages/messenger/background/direct"
import { WaalletContentProvider } from "~packages/waallet/content/provider"

export const ProviderContext = createContext<{
  provider: ethers.BrowserProvider
}>({
  provider: null
})

export function ProviderContextProvider({ children }: { children: ReactNode }) {
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

export const useProviderContext = () => {
  return useContext(ProviderContext)
}
