import { type UserOperation } from "~packages/bundler/userOperation"
import { Address } from "~packages/primitive"
import { StateActor } from "~storage/local/actor"
import {
  TransactionStatus,
  TransactionType,
  type ERC4337TransactionRejected,
  type ERC4337TransactionSent
} from "~storage/local/state"
import type { HexString } from "~typing"

import type { BackgroundStateCreator } from "../middleware/background"
import type { StateSlice } from "./state"

// TODO: Rename to request slice
export interface TransactionSlice {
  /* Profile */

  switchProfile: (profile: {
    accountId: string
    networkId: string
  }) => Promise<void>

  /* ERC-4337 */

  getERC4337TransactionType: (
    networkId: string,
    entryPoint: Address
  ) => TransactionType

  markERC4337TransactionRejected(
    txId: string,
    data: {
      entryPoint: Address
      userOp: UserOperation
    }
  ): Promise<void>

  markERC4337TransactionSent(
    txId: string,
    data: {
      entryPoint: Address
      userOp: UserOperation
      userOpHash: HexString
    }
  ): Promise<void>

  /* EIP-712 */

  cancelEip712Request(requestId: string): Promise<void>

  resolveEip712Request(requestId: string, signature: HexString): Promise<void>
}

export const createTransactionSlice: BackgroundStateCreator<
  StateSlice & TransactionSlice,
  TransactionSlice
> = (set, get) => ({
  /* Profile */

  switchProfile: async (profile: { accountId: string; networkId: string }) => {
    const {
      state: { account, network, networkActive }
    } = get()
    if (
      networkActive === profile.networkId &&
      network[networkActive].accountActive === profile.accountId
    ) {
      return
    }
    if (
      network[profile.networkId].chainId !== account[profile.accountId].chainId
    ) {
      throw new Error(
        `Account ${profile.accountId} doesn't exist in network ${profile.networkId}`
      )
    }
    await set(({ state }) => {
      state.networkActive = profile.networkId
      state.network[profile.networkId].accountActive = profile.accountId
    })
  },

  /* ERC-4337 */

  getERC4337TransactionType(networkId: string, entryPoint: Address) {
    const network = get().state.network[networkId]
    if (entryPoint.isEqual(network.entryPoint["v0.6"])) {
      return TransactionType.ERC4337V0_6
    }
    return TransactionType.ERC4337V0_7
  },

  markERC4337TransactionRejected: async (txId, data) => {
    await set(({ state, getERC4337TransactionType }) => {
      const stateActor = new StateActor(state)
      const tx = stateActor.getTransactionRequest(txId)
      const txRejected: ERC4337TransactionRejected = {
        id: tx.id,
        type: getERC4337TransactionType(tx.networkId, data.entryPoint),
        status: TransactionStatus.Rejected,
        accountId: tx.accountId,
        networkId: tx.networkId,
        createdAt: tx.createdAt,
        detail: {
          entryPoint: data.entryPoint.toString(),
          data: data.userOp.unwrap() as any
        }
      }
      state.account[txRejected.accountId].transactionLog[txRejected.id] =
        txRejected
      delete state.pendingRequest[txId]
    })
  },

  markERC4337TransactionSent: async (txId, data) => {
    await set(({ state, getERC4337TransactionType }) => {
      const stateActor = new StateActor(state)
      const tx = stateActor.getTransactionRequest(txId)
      const txSent: ERC4337TransactionSent = {
        id: tx.id,
        type: getERC4337TransactionType(tx.networkId, data.entryPoint),
        status: TransactionStatus.Sent,
        accountId: tx.accountId,
        networkId: tx.networkId,
        createdAt: tx.createdAt,
        detail: {
          entryPoint: data.entryPoint.toString(),
          data: data.userOp.unwrap() as any
        },
        receipt: {
          userOpHash: data.userOpHash
        }
      }
      state.account[txSent.accountId].transactionLog[txSent.id] = txSent
      delete state.pendingRequest[txId]
    })
  },

  /* EIP-712 */

  cancelEip712Request: async (requestId: string) => {
    await set(({ state }) => {
      const stateActor = new StateActor(state)
      const request = stateActor.getEip712Request(requestId)
      delete state.pendingRequest[request.id]
    })
  },

  resolveEip712Request: async (requestId: string, signature: HexString) => {
    await set(({ state }) => {
      const stateActor = new StateActor(state)
      const request = stateActor.getEip712Request(requestId)
      request.signature = signature
    })
  }
})
