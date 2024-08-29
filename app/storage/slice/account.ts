import { PasskeyAccount } from "~packages/account/PasskeyAccount"
import type { SimpleAccount } from "~packages/account/SimpleAccount"
import { Address } from "~packages/primitive"
import number from "~packages/util/number"
import { StateActor } from "~storage/local/actor"

import type { BackgroundStateCreator } from "../middleware/background"
import type { StateSlice } from "./state"

export type Token = {
  address: Address
  symbol: string
  decimals: number
  balance: bigint
}

export interface AccountSlice {
  /* Account */

  createSimpleAccount: (
    name: string,
    account: SimpleAccount,
    networkId: string
  ) => Promise<void>
  createPasskeyAccount: (
    name: string,
    account: PasskeyAccount,
    networkId: string
  ) => Promise<void>
  switchAccount: (accountId: string) => Promise<void>

  /* Token */

  importToken: (accountId: string, token: Token) => Promise<void>
}

export const createAccountSlice: BackgroundStateCreator<
  StateSlice,
  AccountSlice
> = (set) => ({
  /* Account */

  createSimpleAccount: async (
    name: string,
    account: SimpleAccount,
    networkId: string
  ) => {
    const data = account.dump()
    await set(({ state }) => {
      new StateActor(state).createAccount(
        {
          ...data,
          name,
          salt: number.toHex(data.salt)
        },
        networkId
      )
    })
  },

  createPasskeyAccount: async (
    name: string,
    account: PasskeyAccount,
    networkId: string
  ) => {
    const data = account.dump()
    await set(({ state }) => {
      new StateActor(state).createAccount(
        {
          ...data,
          name,
          publicKey: {
            x: number.toHex(data.publicKey.x),
            y: number.toHex(data.publicKey.y)
          },
          salt: number.toHex(data.salt)
        },
        networkId
      )
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

  /* Token */

  importToken: async (accountId: string, token: Token) => {
    await set(({ state }) => {
      const imported = state.account[accountId].tokens.some((t) =>
        token.address.isEqual(t.address)
      )
      if (imported) {
        return
      }
      state.account[accountId].tokens.push({
        address: token.address.toString(),
        symbol: token.symbol,
        decimals: token.decimals,
        balance: number.toHex(token.balance)
      })
    })
  }
})
