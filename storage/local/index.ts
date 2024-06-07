import { v4 as uuidv4 } from "uuid"
import browser from "webextension-polyfill"

import { getConfig } from "~config"
import { AccountType } from "~packages/account"
import type { UserOperationData } from "~packages/bundler"
import { ObservableStorage } from "~packages/storage/observable"
import type { B64UrlString, HexString, Nullable } from "~typing"

let storage: ObservableStorage<State>

export async function getLocalStorage() {
  if (!storage) {
    // TODO: Check browser.runtime.lastError
    const localStorage = await browser.storage.local.get(null)
    storage = new ObservableStorage<State>(localStorage as State)
    storage.subscribe(async (state) => {
      console.log("[storage] Write state into storage")
      await browser.storage.local.set(state)
    })
    const state = storage.get()
    const config = getConfig()

    // Load accounts absent into storage
    const account = state.account ?? {}
    config.accounts.forEach((a) => {
      const targetAccount = Object.values(account).find(
        ({ address, chainId }) => a.chainId === chainId && a.address === address
      )
      if (targetAccount) {
        return
      }
      const accountId = uuidv4()
      Object.assign(account, {
        [accountId]: {
          ...a,
          transactionLog: {},
          balance: "0x00",
          tokens: []
        }
      })
    })

    // Load networks absent into storage
    const network = state.network ?? {}
    let networkActive = state.networkActive
    config.networks.forEach((n) => {
      const targetNetwork = Object.values(network).find(
        ({ chainId }) => n.chainId === chainId
      )
      const fallbackAccount = Object.entries(account).find(
        ([_, a]) => a.chainId === n.chainId
      )
      const fallbackAccountActive = fallbackAccount ? fallbackAccount[0] : null
      if (targetNetwork) {
        if (!targetNetwork.accountActive) {
          targetNetwork.accountActive = fallbackAccountActive
        }
        return
      }
      const networkId = uuidv4()
      Object.assign(network, {
        [networkId]: {
          chainId: n.chainId,
          name: n.name,
          nodeRpcUrl: n.nodeRpcUrl,
          bundlerRpcUrl: n.bundlerRpcUrl,
          accountActive: fallbackAccountActive,
          accountFactory: n.accountFactory
        }
      })
      if (n.active && !networkActive) {
        networkActive = networkId
      }
    })
    // TODO: Only for development at this moment. Remove following when getting to production.
    // Enable only network specified in env
    storage.set((draft) => {
      return {
        ...draft,
        networkActive: networkActive ?? Object.keys(network)[0],
        network,
        account,
        pendingTransaction: {}
      }
    })
  }
  return storage
}

/* State */

export type State = {
  networkActive: string
  network: {
    [id: string]: Network
  }
  account: {
    [id: string]: Account
  }
  paymaster: {
    [id: string]: Paymaster
  }
  pendingTransaction: {
    [txId: string]: TransactionPending
  }
}

/* Netowork */

export type Network = {
  chainId: number
  name: string
  nodeRpcUrl: string
  bundlerRpcUrl: string
  accountActive: Nullable<HexString>
  accountFactory: {
    [type in AccountType]: {
      address: HexString
    }
  }
}

/* Account */

export type Account = SimpleAccount | PasskeyAccount

export type AccountMeta<T> = {
  transactionLog: {
    [txId: string]: TransactionLog
  }
  balance: HexString
  tokens: Token[]
} & T

export type SimpleAccount = AccountMeta<{
  type: AccountType.SimpleAccount
  chainId: number
  address: HexString
  ownerPrivateKey: HexString
}>

export type PasskeyAccount = AccountMeta<{
  type: AccountType.PasskeyAccount
  chainId: number
  address: HexString
  credentialId: B64UrlString
  publicKey?: {
    x: HexString
    y: HexString
  }
  factoryAddress?: HexString
  salt?: HexString
}>

export type Token = {
  address: HexString
  symbol: string
  decimals: number
  balance: HexString
}

/* Paymaster */

export enum PaymasterType {
  VerifyingPaymaster = "VerifyingPaymaster"
}

export type Paymaster = VerifyingPaymaster

export type VerifyingPaymaster = {
  type: PaymasterType
  chainId: number
  address: HexString
  ownerPrivateKey: HexString
}

/* Transaction */

export enum TransactionStatus {
  // Waiting to be processed in local user operation pool.
  Pending = "Pending",
  // User rejects the user operation.
  Rejected = "Rejected",
  // Bundler accepts the user operation.
  Sent = "Sent",
  // Bundler rejects the user operation.
  Failed = "Failed",
  // User operation is executed on chain.
  Succeeded = "Succeeded",
  // User opreation is reverted on chain.
  Reverted = "Reverted"
}

export enum TransactionType {
  ERC4337v06 = "ERC4337v06"
}

/* Transaction - Pending */

export type TransactionPending = {
  id: string
  status: TransactionStatus.Pending
  createdAt: number
  senderId: string
  networkId: string
  to: HexString
  value: HexString
  data: HexString
  nonce?: HexString
  gasLimit?: HexString
  gasPrice?: HexString
}

/* Transaction - Log */

export type TransactionLog = ERC4337v06TransactionLog

export type TransactionLogMeta<T> = {
  id: string
  senderId: string
  networkId: string
  createdAt: number
} & T

/* Transaction - ERC4337v06 */

export type ERC4337v06TransactionLog =
  | ERC4337v06TransactionRejected
  | ERC4337v06TransactionSent
  | ERC4337v06TransactionFailed
  | ERC4337v06TransactionSucceeded
  | ERC4337v06TransactionReverted

export type ERC4337v06TransactionMeta<T> = TransactionLogMeta<{
  type: TransactionType.ERC4337v06
  detail: ERC4337v06TransactionDetail
}> &
  T

export type ERC4337v06TransactionDetail = {
  entryPoint: HexString
  data: UserOperationData
}

export type ERC4337v06TransactionRejected = ERC4337v06TransactionMeta<{
  status: TransactionStatus.Rejected
}>

export type ERC4337v06TransactionSent = ERC4337v06TransactionMeta<{
  status: TransactionStatus.Sent
  receipt: {
    userOpHash: HexString
  }
}>

export type ERC4337v06TransactionFailed = ERC4337v06TransactionMeta<{
  status: TransactionStatus.Failed
  receipt: {
    userOpHash: HexString
    errorMessage: string
  }
}>

export type ERC4337v06TransactionSucceeded = ERC4337v06TransactionMeta<{
  status: TransactionStatus.Succeeded
  receipt: {
    userOpHash: HexString
    transactionHash: HexString
    blockHash: HexString
    blockNumber: HexString
  }
}>

export type ERC4337v06TransactionReverted = ERC4337v06TransactionMeta<{
  status: TransactionStatus.Reverted
  receipt: {
    userOpHash: HexString
    transactionHash: HexString
    blockHash: HexString
    blockNumber: HexString
    errorMessage: string
  }
}>
