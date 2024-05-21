import { v4 as uuidV4 } from "uuid"
import browser from "webextension-polyfill"
import { create, type StoreApi } from "zustand"
import { useShallow } from "zustand/react/shallow"

import { StorageAction } from "~background/messages/storage"
import { PasskeyAccount } from "~packages/account/PasskeyAccount"
import type { UserOperationData } from "~packages/bundler"
import number from "~packages/util/number"
import {
  UserOperationStatus,
  type State,
  type UserOperationLog,
  type UserOperationSent
} from "~storage/local"
import type { HexString } from "~typing"

import { StorageMessenger } from "./messenger"
import { background } from "./middleware/background"

const storageMessenger = new StorageMessenger()

// TODO: Split as slices
interface Storage {
  state: State
  createAccount: (account: PasskeyAccount, networkId: string) => Promise<void>
  switchAccount: (accountId: string) => Promise<void>
  switchNetwork: (networkId: string) => Promise<void>
  markUserOperationRejected: (userOpId: string) => Promise<void>
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
      createAccount: async (account: PasskeyAccount, networkId: string) => {
        const id = uuidV4()
        const data = account.dump()
        await set(({ state }) => {
          const network = state.network[networkId]
          // TODO: Design an account periphery prototype
          const periphery = {
            userOpLog: {}
          }
          state.account[id] = {
            ...data,
            ...periphery,
            chainId: network.chainId,
            // TODO: Design a value object
            publicKey: {
              x: number.toHex(data.publicKey.x),
              y: number.toHex(data.publicKey.y)
            },
            salt: number.toHex(data.salt)
          }
          // Set the new account as active
          network.accountActive = id
        })
      },
      switchAccount: async (accountId: string) => {
        await set(({ state }) => {
          const { account, network, networkActive } = state
          if (account[accountId].chainId !== network[networkActive].chainId) {
            throw new Error("Cannot switch to account in other network")
          }
          state.network[state.networkActive].accountActive = accountId
        })
      },
      switchNetwork: async (networkId: string) => {
        await set(({ state }) => {
          if (!state.network[networkId]) {
            throw new Error(`Unknown network: ${networkId}`)
          }
          state.networkActive = networkId
        })
      },
      markUserOperationRejected: async (userOpId: string) => {
        await set(({ state }) => {
          const userOpLog = state.userOpPool[userOpId]
          userOpLog.status = UserOperationStatus.Rejected
        })
      },
      markUserOperationSent: async (
        userOpId: string,
        userOpHash: HexString,
        userOp: UserOperationData
      ) => {
        await set(({ state }) => {
          const userOpLog = state.userOpPool[userOpId]
          userOpLog.userOp = userOp
          userOpLog.status = UserOperationStatus.Sent
          ;(userOpLog as UserOperationSent).receipt = {
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
    useShallow(({ state }) => {
      const networkId = id ?? state.networkActive
      return {
        id: networkId,
        ...state.network[networkId]
      }
    })
  )
}

export const useNetworks = () => {
  return useStorage(
    useShallow(({ state }) => {
      return Object.entries(state.network).map(([id, n]) => ({
        id,
        ...n
      }))
    })
  )
}

export const useShouldOnboard = () => {
  return useStorage(
    useShallow(({ state }) => {
      const network = state.network[state.networkActive]
      return (
        Object.values(state.account).filter(
          (a) => a.chainId === network.chainId
        ).length === 0
      )
    })
  )
}

export const useAccount = (id?: string) => {
  return useStorage(
    useShallow(({ state }) => {
      const network = state.network[state.networkActive]
      const accountId = id ?? network.accountActive
      return {
        id: accountId,
        ...state.account[accountId]
      }
    })
  )
}

export const useAccounts = () => {
  return useStorage(
    useShallow(({ state }) => {
      const network = state.network[state.networkActive]
      return Object.entries(state.account)
        .filter(([_, a]) => a.chainId === network.chainId)
        .map(([id, a]) => {
          return { id, ...a }
        })
    })
  )
}

export const useAction = () => {
  return useStorage(
    useShallow(({ state, ...action }) => {
      return action
    })
  )
}

export const useUserOperationLogs = (
  filter: (userOp: UserOperationLog) => boolean = () => true
) => {
  return useStorage(
    useShallow(({ state }) => {
      return Object.values(state.userOpPool).filter(filter)
    })
  )
}

export const usePendingUserOperationLogs = (
  filter: (userOp: UserOperationLog) => boolean = () => true
) => {
  return useUserOperationLogs((userOp) => {
    return userOp.status === UserOperationStatus.Pending && filter(userOp)
  })
}
