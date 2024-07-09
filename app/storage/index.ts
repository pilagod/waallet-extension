import { applyPatches, type Patch } from "immer"
import browser from "webextension-polyfill"
import { create } from "zustand"
import { useShallow } from "zustand/react/shallow"

import { StorageAction } from "~background/messages/storage"
import { type UserOperation } from "~packages/bundler/userOperation"
import address from "~packages/util/address"
import {
  TransactionStatus,
  TransactionType,
  type ERC4337TransactionRejected,
  type ERC4337TransactionSent
} from "~storage/local/state"
import type { HexString } from "~typing"

import { StorageMessenger } from "./messenger"
import { background } from "./middleware/background"
import { createAccountSlice, type AccountSlice } from "./slice/account"
import { createNetworkSlice, type NetworkSlice } from "./slice/network"
import { createProfileSlice, type ProfileSlice } from "./slice/profile"
import { createStateSlice, type StateSlice } from "./slice/state"

const storageMessenger = new StorageMessenger()

// TODO: Split as slices
interface Storage extends StateSlice, AccountSlice, NetworkSlice, ProfileSlice {
  /* Transaction - ERC4337*/

  getERC4337TransactionType: (
    networkId: string,
    entryPoint: HexString
  ) => TransactionType

  markERC4337TransactionRejected(
    txId: string,
    data: {
      entryPoint: HexString
      userOp: UserOperation
    }
  ): Promise<void>

  markERC4337TransactionSent(
    txId: string,
    data: {
      entryPoint: HexString
      userOp: UserOperation
      userOpHash: HexString
    }
  ): Promise<void>
}

// @dev: This background middleware sends state first into background storage.
// To apply new state, listen to background message in `sync` function and call `set` to update app state.
export const useStorage = create<Storage>()(
  background(
    (set, get, ...others) => ({
      ...createStateSlice(set, get, ...others),
      ...createAccountSlice(set, get, ...others),
      ...createNetworkSlice(set, get, ...others),
      ...createProfileSlice(set, get, ...others),

      /* Transaction */

      getERC4337TransactionType(networkId: string, entryPoint: HexString) {
        const network = get().state.network[networkId]
        if (address.isEqual(entryPoint, network.entryPoint["v0.6"])) {
          return TransactionType.ERC4337V0_6
        }
        return TransactionType.ERC4337V0_7
      },

      markERC4337TransactionRejected: async (txId, data) => {
        await set(({ state, getERC4337TransactionType }) => {
          const tx = state.pendingTransaction[txId]
          const txRejected: ERC4337TransactionRejected = {
            id: tx.id,
            type: getERC4337TransactionType(tx.networkId, data.entryPoint),
            status: TransactionStatus.Rejected,
            senderId: tx.senderId,
            networkId: tx.networkId,
            createdAt: tx.createdAt,
            detail: {
              entryPoint: data.entryPoint,
              data: data.userOp.unwrap() as any
            }
          }
          state.account[txRejected.senderId].transactionLog[txRejected.id] =
            txRejected
          delete state.pendingTransaction[tx.id]
        })
      },

      markERC4337TransactionSent: async (txId, data) => {
        await set(({ state, getERC4337TransactionType }) => {
          const tx = state.pendingTransaction[txId]
          const txSent: ERC4337TransactionSent = {
            id: tx.id,
            type: getERC4337TransactionType(tx.networkId, data.entryPoint),
            status: TransactionStatus.Sent,
            senderId: tx.senderId,
            networkId: tx.networkId,
            createdAt: tx.createdAt,
            detail: {
              entryPoint: data.entryPoint,
              data: data.userOp.unwrap() as any
            },
            receipt: {
              userOpHash: data.userOpHash
            }
          }
          state.account[txSent.senderId].transactionLog[txSent.id] = txSent
          delete state.pendingTransaction[tx.id]
        })
      }

      /* Token */
    }),
    {
      async set(patches: Patch[]) {
        await storageMessenger.set(
          patches.map((p) => {
            const path = [...p.path]
            if (path[0] === "state") {
              path.shift()
            }
            return { ...p, path }
          })
        )
      },
      sync(get, set) {
        browser.runtime.onMessage.addListener((message) => {
          if (message.action !== StorageAction.Sync) {
            return
          }
          console.log("[popup] Receive state update from background")
          set({ state: applyPatches(get().state, message.patches) })
        })
      }
    }
  )
)

storageMessenger.get().then((state) => {
  useStorage.setStateLocally({ state })
})

/* Custom Hooks */

export const useAction = () => {
  return useStorage(
    useShallow(({ state, ...action }) => {
      return action
    })
  )
}

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
      const network = useNetwork()
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
      const network = useNetwork()
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
      const network = useNetwork()
      return Object.entries(state.account)
        .filter(([_, a]) => a.chainId === network.chainId)
        .map(([id, a]) => {
          return { id, ...a }
        })
    })
  )
}

export const useTransactionLogs = (accountId: string) => {
  return useStorage(
    useShallow(({ state }) => {
      return Object.values(state.account[accountId].transactionLog)
    })
  )
}

export const usePendingTransactions = () => {
  return useStorage(
    useShallow(({ state }) => {
      return Object.values(state.pendingTransaction)
    })
  )
}

export const useTokens = (accountId?: string) => {
  return useStorage(
    useShallow(({ state }) => {
      const account = useAccount(accountId)
      return state.account[account.id].tokens
    })
  )
}
