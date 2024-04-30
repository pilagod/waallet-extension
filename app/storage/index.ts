import { produce } from "immer"
import browser from "webextension-polyfill"
import { create } from "zustand"
import { immer } from "zustand/middleware/immer"
import { useShallow } from "zustand/react/shallow"

import {
  StorageAction,
  StorageMessenger,
  UserOperationStatus,
  type State,
  type UserOperationStatement
} from "~background/storage/local"
import type { UserOperationData } from "~packages/bundler"

const storageMessenger = new StorageMessenger()

// TODO: Split as slices
interface Storage {
  state: State
  markUserOperationSent: (userOpId: string, userOp: UserOperationData) => void
}

// @dev: This middleware sends state into background instead of store.
// To apply new state, listen to background message and call `setState` on store with background state.
const background: typeof immer<Storage> = (initializer) => {
  return (set, get, store) => {
    const sendToBackground: typeof set = async (partial) => {
      const nextStorage =
        typeof partial === "function"
          ? produce<Storage>(partial as any)(get())
          : partial
      // NOTE: Skip replace flag to avoid accidently erasing whole storage.
      await storageMessenger.set(nextStorage.state)
    }
    browser.runtime.onMessage.addListener((message) => {
      if (message.action !== StorageAction.Sync) {
        return
      }
      console.log("[popup] Receive state update from background")
      store.setState({ state: message.state })
    })
    return initializer(sendToBackground, get, store)
  }
}

export const useStorage = create<Storage>()(
  background((set) => ({
    state: null,
    markUserOperationSent: (userOpId: string, userOp: UserOperationData) => {
      set(({ state }) => {
        const userOpStmt = state.userOpPool[userOpId]
        userOpStmt.userOp = userOp
        userOpStmt.status = UserOperationStatus.Sent
      })
    }
  }))
)

storageMessenger.get().then((state) => {
  useStorage.setState({ state })
})

/* Custom Hooks */

export const useNetwork = (id?: string) => {
  return useStorage(
    useShallow(({ state }) => state.network[id ?? state.networkActive])
  )
}

export const useAccount = (id?: string) => {
  return useStorage(
    useShallow(({ state }) => {
      const network = state.network[state.networkActive]
      return state.account[id ?? network.accountActive]
    })
  )
}

export const useUserOperationStatements = (
  filter: (userOp: UserOperationStatement) => boolean = () => true
) => {
  return useStorage(
    useShallow(({ state }) => {
      return Object.values(state.userOpPool).filter(filter)
    })
  )
}

export const usePendingUserOperationStatements = (
  filter: (userOp: UserOperationStatement) => boolean = () => true
) => {
  return useUserOperationStatements((userOp) => {
    return userOp.status === UserOperationStatus.Pending && filter(userOp)
  })
}
