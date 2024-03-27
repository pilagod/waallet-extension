import { produce } from "immer"
import browser from "webextension-polyfill"
import { create } from "zustand"
import { immer } from "zustand/middleware/immer"
import { useShallow } from "zustand/react/shallow"

import {
  StorageAction,
  StorageMessenger,
  type State
} from "~background/storage"

const storageMessenger = new StorageMessenger()

// @dev: This middleware sends state into background instead of store.
// To apply new state, listen to background message and call `setState` on store with background state.
const background: typeof immer<Storage> = (initializer) => {
  return (set, get, store) => {
    const sendToBackground: typeof set = async (partial, replace) => {
      const nextStorage =
        typeof partial === "function"
          ? produce<Storage>(partial as any)(get())
          : partial
      await storageMessenger.set(nextStorage.state)
    }
    return initializer(sendToBackground, get, store)
  }
}

interface Storage {
  state: State
}

export const useStorage = create<Storage>()(
  background((_) => ({
    state: null
  }))
)

storageMessenger.get().then((state) => {
  useStorage.setState({ state })
})

browser.runtime.onMessage.addListener((message) => {
  if (message.action !== StorageAction.Sync) {
    return
  }
  console.log("[popup] Receive state update from background")
  useStorage.setState({ state: message.state })
})

/* Custom Hooks */

export const useNetwork = () => {
  return useStorage(
    useShallow(({ state }) => state.network[state.networkActive])
  )
}

export const useAccount = () => {
  return useStorage(
    useShallow(({ state }) => {
      const network = state.network[state.networkActive]
      return state.account[network.accountActive]
    })
  )
}
