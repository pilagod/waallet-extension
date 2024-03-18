import * as ethers from "ethers"
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode
} from "react"

import { StorageMessenger } from "~background/messages/storage"
import { type State } from "~background/storage"
import { BackgroundDirectMessenger } from "~packages/messenger/background/direct"
import { WaalletContentProvider } from "~packages/waallet/content/provider"

export const ProviderContext = createContext<{
  provider: ethers.BrowserProvider
}>({
  provider: null
})

export function ProviderCtxProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(null)
  const provider = new ethers.BrowserProvider(
    new WaalletContentProvider(new BackgroundDirectMessenger())
  )

  useEffect(() => {
    async function getState() {
      const state = await new StorageMessenger().get()
      console.log("state in storage", state)
    }
    getState()
  })

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
