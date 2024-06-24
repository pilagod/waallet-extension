import { getAddress } from "ethers"
import { applyPatches, type Patch } from "immer"
import { v4 as uuidV4 } from "uuid"
import browser from "webextension-polyfill"
import { create } from "zustand"
import { useShallow } from "zustand/react/shallow"

import { StorageAction } from "~background/messages/storage"
import { PasskeyAccount } from "~packages/account/PasskeyAccount"
import { type UserOperation } from "~packages/bundler/userOperation"
import address from "~packages/util/address"
import number from "~packages/util/number"
import {
  TransactionStatus,
  TransactionType,
  type ERC4337TransactionRejected,
  type ERC4337TransactionSent,
  type State,
  type Token
} from "~storage/local/state"
import type { BigNumberish, HexString } from "~typing"

import { StorageMessenger } from "./messenger"
import { background } from "./middleware/background"

const storageMessenger = new StorageMessenger()

// TODO: Split as slices
interface Storage {
  state: State

  /* Account */

  createAccount: (account: PasskeyAccount, networkId: string) => Promise<void>

  switchAccount: (accountId: string) => Promise<void>

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

  /* Network */

  switchNetwork: (networkId: string) => Promise<void>

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
    (set, get) => ({
      state: null,

      /* Account */

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
            transactionLog: {},
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
      },

      /* Network */

      switchNetwork: async (networkId: string) => {
        await set(({ state }) => {
          if (!state.network[networkId]) {
            throw new Error(`Unknown network: ${networkId}`)
          }
          state.networkActive = networkId
        })
      },

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
