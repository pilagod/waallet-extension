import { type UserOperation } from "~packages/bundler/userOperation"
import { StateActor } from "~storage/local/actor"
import {
  TransactionStatus,
  TransactionType,
  type Erc4337TransactionRejected,
  type Erc4337TransactionSent
} from "~storage/local/state"
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
    entryPoint: HexString
  ): TransactionType

  markErc4337TransactionRejected(
    txId: string,
    data: {
      entryPoint: HexString
      userOp: UserOperation
    }
  ): Promise<void>

  markErc4337TransactionSent(
    txId: string,
    data: {
      entryPoint: HexString
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

  getErc4337TransactionType: (networkId: string, entryPoint: HexString) => {
    return new StateActor(get().state).getErc4337TransactionType(
      networkId,
      entryPoint
    )
  },

  markErc4337TransactionRejected: async (txId, data) => {
    await set(({ state }) => {
      new StateActor(
        state
      ).resolveErc4337TransactionRequest<Erc4337TransactionRejected>(txId, {
        status: TransactionStatus.Rejected,
        detail: {
          entryPoint: data.entryPoint,
          data: data.userOp.unwrap() as any
        }
      })
    })
  },

  markErc4337TransactionSent: async (txId, data) => {
    await set(({ state }) => {
      new StateActor(
        state
      ).resolveErc4337TransactionRequest<Erc4337TransactionSent>(txId, {
        status: TransactionStatus.Sent,
        detail: {
          entryPoint: data.entryPoint,
          data: data.userOp.unwrap() as any
        },
        receipt: {
          userOpHash: data.userOpHash
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
