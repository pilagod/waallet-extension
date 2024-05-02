import browser from "webextension-polyfill"
import { create, type StoreApi } from "zustand"
import { useShallow } from "zustand/react/shallow"

import {
  StorageAction,
  StorageMessenger,
  UserOperationStatus,
  type State,
  type UserOperationSent,
  type UserOperationStatement
} from "~background/storage/local"
import type { UserOperationData } from "~packages/bundler"
import type { HexString } from "~typing"

import { background } from "./middleware/background"

const storageMessenger = new StorageMessenger()

// TODO: Split as slices
interface Storage {
  state: State
  markUserOperationSent: (
    userOpId: string,
    userOpHash: HexString,
    userOp: UserOperationData
  ) => Promise<void>
}

// @dev: This background middleware sends state first into background storage.
// To apply new state, listen to background message in `sync` function and call `set` to update app state.
export const useStorage = create<Storage>()(
  background(
    (set) => ({
      state: null,
      markUserOperationSent: async (
        userOpId: string,
        userOpHash: HexString,
        userOp: UserOperationData
      ) => {
        await set(({ state }) => {
          const userOpStmt = state.userOpPool[userOpId]
          userOpStmt.userOp = userOp
          userOpStmt.status = UserOperationStatus.Sent
          ;(userOpStmt as UserOperationSent).receipt = {
            userOpHash
          }
        })
      }
    }),
    {
      async set(storage: Storage) {
        await storageMessenger.set(storage.state)
      },
      sync(set: StoreApi<Storage>["setState"]) {
        browser.runtime.onMessage.addListener((message) => {
          if (message.action !== StorageAction.Sync) {
            return
          }
          console.log("[popup] Receive state update from background")
          set({ state: message.state })
        })
      }
    }
  )
)

storageMessenger.get().then((state) => {
  useStorage.setStateLocally({ state })
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
