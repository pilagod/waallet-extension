import { type UserOperation } from "~packages/bundler/userOperation"
import { Address } from "~packages/primitive"
import { StateActor } from "~storage/local/actor"
import { TransactionStatus, TransactionType } from "~storage/local/state"
import type { HexString } from "~typing"

import type { BackgroundStateCreator } from "../middleware/background"
import type { StateSlice } from "./state"

export interface RequestSlice {
  /* Profile */

  switchProfile: (profile: {
    accountId: string
    networkId: string
  }) => Promise<void>

  /* ERC-4337 */

  getErc4337TransactionType(
    networkId: string,
    entryPoint: Address
  ): TransactionType

  markErc4337TransactionRejected(
    txId: string,
    data: {
      entryPoint: Address
      userOp: UserOperation
    }
  ): Promise<void>

  markErc4337TransactionSent(
    txId: string,
    data: {
      entryPoint: Address
      userOp: UserOperation
      userOpHash: HexString
    }
  ): Promise<void>

  /* EIP-712 */

  rejectEip712Request(requestId: string): Promise<void>

  resolveEip712Request(requestId: string, signature: HexString): Promise<void>
}

export const createRequestSlice: BackgroundStateCreator<
  StateSlice & RequestSlice,
  RequestSlice
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

  getErc4337TransactionType: (networkId: string, entryPoint: Address) => {
    return new StateActor(get().state).getErc4337TransactionType(
      networkId,
      entryPoint
    )
  },

  markErc4337TransactionRejected: async (txId, data) => {
    await set(({ state }) => {
      new StateActor(state).resolveErc4337TransactionRequest(txId, {
        status: TransactionStatus.Rejected,
        detail: data
      })
    })
  },

  markErc4337TransactionSent: async (txId, data) => {
    const { userOpHash, ...detail } = data
    await set(({ state }) => {
      new StateActor(state).resolveErc4337TransactionRequest(txId, {
        status: TransactionStatus.Sent,
        detail,
        receipt: {
          userOpHash
        }
      })
    })
  },

  /* EIP-712 */

  rejectEip712Request: async (requestId: string) => {
    await set(({ state }) => {
      new StateActor(state).rejectEip712Request(requestId)
    })
  },

  resolveEip712Request: async (requestId: string, signature: HexString) => {
    await set(({ state }) => {
      new StateActor(state).resolveEip712Request(requestId, signature)
    })
  }
})
