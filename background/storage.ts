import browser from "webextension-polyfill"

import { config } from "~config"
import { ObservableStorage } from "~packages/storage/observable"
import type { HexString } from "~typing"

let storage: ObservableStorage<State>

export async function getStorage() {
  if (!storage) {
    // TODO: Check browser.runtime.lastError
    const state = await browser.storage.local.get(null)
    storage = new ObservableStorage<State>(state as State)
    storage.subscribe(async (state) => {
      await browser.storage.local.set(state)
    })
    // TODO: Only for development at this moment.
    // Remove it when getting to production.
    storage.set({
      network: {
        [config.chainId]: {
          chainId: config.chainId,
          nodeRpcUrl: config.nodeRpcUrl,
          bundlerRpcUrl: config.bundlerRpcUrl,
          selected: true,
          account: {
            ...(config.simpleAccountAddress && {
              [config.simpleAccountAddress]: {
                type: AccountType.SimpleAccount,
                address: config.simpleAccountAddress,
                ownerPrivateKey: config.simpleAccountOwnerPrivateKey
              }
            }),
            ...(config.passkeyAccountAddress && {
              [config.passkeyAccountAddress]: {
                type: AccountType.PasskeyAccount,
                address: config.passkeyAccountAddress
              }
            })
          },
          paymaster: {
            ...(config.verifyingPaymasterAddress && {
              [config.verifyingPaymasterAddress]: {
                type: PaymasterType.VerifyingPaymaster,
                address: config.verifyingPaymasterAddress,
                ownerPrivateKey: config.verifyingPaymasterOwnerPrivateKey
              }
            })
          }
        }
      }
    })
  }
  return storage
}

/* State */

export type State = {
  network: {
    [chainId: number]: Network
  }
}

/* Netowork */

export type Network = {
  chainId: number
  nodeRpcUrl: string
  bundlerRpcUrl: string
  selected: boolean
  account: {
    [address: string]: Account
  }
  paymaster: {
    [address: string]: Paymaster
  }
}

/* Account */

export enum AccountType {
  SimpleAccount = "SimpleAccount",
  PasskeyAccount = "PasskeyAccount"
}

export type Account = SimpleAccount | PasskeyAccount

export type SimpleAccount = {
  type: AccountType.SimpleAccount
  address: HexString
  ownerPrivateKey: HexString
}

export type PasskeyAccount = {
  type: AccountType.PasskeyAccount
  address: HexString
}

/* Paymaster */

export enum PaymasterType {
  VerifyingPaymaster = "VerifyingPaymaster"
}

export type Paymaster = VerifyingPaymaster

export type VerifyingPaymaster = {
  type: PaymasterType
  address: HexString
  ownerPrivateKey: HexString
}
