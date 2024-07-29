import { v4 as uuidV4 } from "uuid"

import { PasskeyAccount } from "~packages/account/PasskeyAccount"
import address from "~packages/util/address"
import number from "~packages/util/number"
import { type AccountToken } from "~storage/local/state"
import type { BigNumberish, HexString } from "~typing"

import type { BackgroundStateCreator } from "../middleware/background"
import type { StateSlice } from "./state"

export interface AccountSlice {
  /* Account */

  createAccount: (
    name: string,
    account: PasskeyAccount,
    networkId: string
  ) => Promise<void>
  switchAccount: (accountId: string) => Promise<void>

  /* Token */

  updateBalance: (accountId: string, balance: BigNumberish) => Promise<void>
  importToken: (accountId: string, token: AccountToken) => Promise<void>
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

export const createAccountSlice: BackgroundStateCreator<
  StateSlice,
  AccountSlice
> = (set) => ({
  /* Account */

  createAccount: async (
    name: string,
    account: PasskeyAccount,
    networkId: string
  ) => {
    const id = uuidV4()
    const data = account.dump()
    await set(({ state }) => {
      const network = state.network[networkId]
      state.account[id] = {
        ...data,
        id,
        name,
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

  /* Token */

  updateBalance: async (accountId: string, balance: BigNumberish) => {
    await set(({ state }) => {
      state.account[accountId].balance = number.toHex(balance)
    })
  },

  importToken: async (accountId: string, token: AccountToken) => {
    await set(({ state }) => {
      state.account[accountId].tokens.push({
        address: address.normalize(token.address),
        symbol: token.symbol,
        decimals: token.decimals,
        balance: token.balance
      })
    })
  },

  removeToken: async (accountId: string, tokenAddress: HexString) => {
    await set(({ state }) => {
      const tokenIndex = state.account[accountId].tokens.findIndex((token) =>
        address.isEqual(token.address, tokenAddress)
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
})
