import * as ethers from "ethers"
import { createContext, type ReactNode } from "react"

import { BackgroundDirectMessenger } from "~packages/messenger/background/direct"
import { WaalletContentProvider } from "~packages/waallet/content/provider"

export const ProviderContext = createContext<{
  provider: ethers.BrowserProvider
}>({
  provider: null
})

export function ProviderContextProvider({ children }: { children: ReactNode }) {
  const provider = new ethers.BrowserProvider(
    new WaalletContentProvider(new BackgroundDirectMessenger()),
    "any"
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

// TODO: Remove it after fully migrated.
export { useProvider as useProviderContext } from "~app/hook/context"
