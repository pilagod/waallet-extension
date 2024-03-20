import { v4 as uuidv4 } from "uuid"
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
    const account = {
      ...(config.simpleAccountAddress && {
        [uuidv4()]: {
          type: AccountType.SimpleAccount,
          chainId: config.chainId,
          address: config.simpleAccountAddress,
          ownerPrivateKey: config.simpleAccountOwnerPrivateKey
        }
      }),
      ...(config.passkeyAccountAddress && {
        [uuidv4()]: {
          type: AccountType.PasskeyAccount,
          chainId: config.chainId,
          address: config.passkeyAccountAddress
        }
      })
    }
    const paymaster = {
      ...(config.verifyingPaymasterAddress && {
        [uuidv4()]: {
          type: PaymasterType.VerifyingPaymaster,
          chainId: config.chainId,
          address: config.verifyingPaymasterAddress,
          ownerPrivateKey: config.verifyingPaymasterOwnerPrivateKey
        }
      })
    }
    const network = {
      [uuidv4()]: {
        chainId: config.chainId,
        nodeRpcUrl: config.nodeRpcUrl,
        bundlerRpcUrl: config.bundlerRpcUrl,
        accountActive: Object.keys(account)[0]
      }
    }
    // TODO: Only for development at this moment. Remove following when getting to production.
    // Enable only network specified in env
    storage.set(
      {
        networkActive: Object.keys(network)[0],
        network,
        account,
        paymaster
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
}

/* Netowork */

export type Network = {
  chainId: number
  nodeRpcUrl: string
  bundlerRpcUrl: string
  accountActive: HexString
}

/* Account */

export enum AccountType {
  SimpleAccount = "SimpleAccount",
  PasskeyAccount = "PasskeyAccount"
}

export type Account = SimpleAccount | PasskeyAccount

export type SimpleAccount = {
  type: AccountType.SimpleAccount
  chainId: number
  address: HexString
  ownerPrivateKey: HexString
}

export type PasskeyAccount = {
  type: AccountType.PasskeyAccount
  chainId: number
  address: HexString
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
