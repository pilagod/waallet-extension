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
    const accountIdentifier = Object.values(account).map((a) => [
      a.chainId,
      a.address
    ])
    config.accounts.forEach((a) => {
      const isExisting =
        accountIdentifier.filter(
          ([chainId, address]) => a.chainId === chainId && a.address === address
        ).length > 0
      if (isExisting) {
        return
      }
      const accountId = uuidv4()
      Object.assign(account, {
        [accountId]: a
      })
    })

    // Load networks absent into storage
    const network = state.network ?? {}
    const networkIdentifier = Object.values(network).map((n) => n.chainId)
    let networkActive = state.networkActive
    config.networks.forEach((n) => {
      const isExisting =
        networkIdentifier.filter((chainId) => n.chainId === chainId).length > 0
      if (isExisting) {
        return
      }
      const networkId = uuidv4()
      const accountIds = Object.entries(account)
        .filter(([, a]) => a.chainId === n.chainId)
        .map(([id]) => id)
      Object.assign(network, {
        [networkId]: {
          chainId: n.chainId,
          name: n.name,
          nodeRpcUrl: n.nodeRpcUrl,
          bundlerRpcUrl: n.bundlerRpcUrl,
          accountActive: accountIds[0] ?? null,
          accountFactory: n.accountFactory
        }
      })
      if (n.active && !networkActive) {
        networkActive = networkId
      }
    })
    // TODO: Only for development at this moment. Remove following when getting to production.
    // Enable only network specified in env
    storage.set(
      {
        networkActive: networkActive ?? Object.keys(network)[0],
        network,
        account,
        userOpPool: {}
      },
      { override: true }
    )
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
  userOpPool: {
    [userOpId: string]: UserOperationLog
  }
  pendingUserOpLog: {
    [userOpId: string]: UserOperationPending
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

export type WithAccountPeriphery<T> = {
  userOpLog: {
    [userOpId: string]: UserOperationLog
  }
} & T

export type SimpleAccount = WithAccountPeriphery<{
  type: AccountType.SimpleAccount
  chainId: number
  address: HexString
  ownerPrivateKey: HexString
}>

export type PasskeyAccount = WithAccountPeriphery<{
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

/* User Operation Pool */

export enum UserOperationStatus {
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

export type UserOperationLog =
  | UserOperationPending
  | UserOperationRejected
  | UserOperationSent
  | UserOperationFailed
  | UserOperationSucceeded
  | UserOperationReverted

export type WithUserOperationDetail<T> = {
  id: string
  createdAt: number
  userOp: UserOperationData
  senderId: string
  networkId: string
  entryPointAddress: string
} & T

export type UserOperationPending = WithUserOperationDetail<{
  status: UserOperationStatus.Pending
}>

export type UserOperationRejected = WithUserOperationDetail<{
  status: UserOperationStatus.Rejected
}>

export type UserOperationSent = WithUserOperationDetail<{
  status: UserOperationStatus.Sent
  receipt: {
    userOpHash: HexString
  }
}>

export type UserOperationFailed = WithUserOperationDetail<{
  status: UserOperationStatus.Failed
  receipt: {
    userOpHash: HexString
    errorMessage: string
  }
}>

export type UserOperationSucceeded = WithUserOperationDetail<{
  status: UserOperationStatus.Succeeded
  receipt: {
    userOpHash: HexString
    transactionHash: HexString
    blockHash: HexString
    blockNumber: HexString
  }
}>

export type UserOperationReverted = WithUserOperationDetail<{
  status: UserOperationStatus.Reverted
  receipt: {
    userOpHash: HexString
    transactionHash: HexString
    blockHash: HexString
    blockNumber: HexString
    errorMessage: string
  }
}>
