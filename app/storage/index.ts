import { getAddress } from "ethers"
import { v4 as uuidV4 } from "uuid"
import browser from "webextension-polyfill"
import { create, type StoreApi } from "zustand"
import { useShallow } from "zustand/react/shallow"

import { StorageAction } from "~background/messages/storage"
import { PasskeyAccount } from "~packages/account/PasskeyAccount"
import type { UserOperationData } from "~packages/bundler"
import address from "~packages/util/address"
import number from "~packages/util/number"
import {
  UserOperationStatus,
  type State,
  type Token,
  type UserOperationPending,
  type UserOperationRejected,
  type UserOperationSent
} from "~storage/local"
import type { BigNumberish, HexString } from "~typing"

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
  updateBalance: (accountId: string, balance: BigNumberish) => Promise<void>
  importToken: (accountId: string, token: Token) => Promise<void>
  updateToken: (
    accountId: string,
    tokenAddress: HexString,
    update: {
      balance?: BigNumberish
      symbol?: string
    }
  ) => Promise<void>
  removeToken: (accountId: string, tokenAddress: HexString) => Promise<void>
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
          state.account[id] = {
            ...data,
            chainId: network.chainId,
            // TODO: Design a value object
            publicKey: {
              x: number.toHex(data.publicKey.x),
              y: number.toHex(data.publicKey.y)
            },
            salt: number.toHex(data.salt),
            // TODO: Design an account periphery prototype
            userOpLog: {},
            balance: "0x00",
            tokens: []
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
          const pendingUserOpLog = state.pendingUserOpLog[userOpId]
          const rejectedUserOpLog: UserOperationRejected = {
            ...pendingUserOpLog,
            status: UserOperationStatus.Rejected
          }
          state.account[rejectedUserOpLog.senderId].userOpLog[
            rejectedUserOpLog.id
          ] = rejectedUserOpLog
          delete state.pendingUserOpLog[pendingUserOpLog.id]
        })
      },
      markUserOperationSent: async (
        userOpId: string,
        userOpHash: HexString,
        userOp: UserOperationData
      ) => {
        await set(({ state }) => {
          const pendingUserOpLog = state.pendingUserOpLog[userOpId]
          const sentUserOpLog: UserOperationSent = {
            ...pendingUserOpLog,
            status: UserOperationStatus.Sent,
            userOp,
            receipt: {
              userOpHash
            }
          }
          state.account[sentUserOpLog.senderId].userOpLog[sentUserOpLog.id] =
            sentUserOpLog
          delete state.pendingUserOpLog[pendingUserOpLog.id]
        })
      },
      updateBalance: async (accountId: string, balance: BigNumberish) => {
        await set(({ state }) => {
          state.account[accountId].balance = number.toHex(balance)
        })
      },
      importToken: async (accountId: string, token: Token) => {
        await set(({ state }) => {
          state.account[accountId].tokens.push({
            address: getAddress(token.address),
            symbol: token.symbol,
            decimals: token.decimals,
            balance: token.balance
          })
        })
      },
      removeToken: async (accountId: string, tokenAddress: HexString) => {
        await set(({ state }) => {
          const tokenIndex = state.account[accountId].tokens.findIndex(
            (token) => address.isEqual(token.address, tokenAddress)
          )
          if (tokenIndex < 0) {
            throw new Error(`Unknown token: ${tokenAddress}`)
          }
          state.account[accountId].tokens.splice(tokenIndex, 1)
        })
      },
      updateToken: async (
        accountId: string,
        tokenAddress: HexString,
        update: {
          balance?: BigNumberish
          symbol?: string
        }
      ) => {
        await set(({ state }) => {
          const token = state.account[accountId].tokens.find((token) =>
            address.isEqual(token.address, tokenAddress)
          )
          if (!token) {
            throw new Error(`Unknown token: ${tokenAddress}`)
          }
          if (update.balance) {
            token.balance = number.toHex(update.balance)
          }
          if (update.symbol) {
            token.symbol = update.symbol
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

export const useUserOperationLogs = (accountId?: string) => {
  const { id } = useAccount(accountId)
  return useStorage(
    useShallow(({ state }) => {
      return Object.values(state.account[id].userOpLog)
    })
  )
}

export const usePendingUserOperationLogs = (
  filter: (userOp: UserOperationPending) => boolean = () => true
) => {
  return useStorage(
    useShallow(({ state }) => {
      return Object.values(state.pendingUserOpLog).filter(filter)
    })
  )
}

export const useTokens = (id?: string) => {
  return useStorage(
    useShallow(({ state }) => {
      const network = state.network[state.networkActive]
      const accountId = id ?? network.accountActive
      return state.account[accountId].tokens
    })
  )
}
