import { JsonRpcProvider, Wallet } from "ethers"
import { v4 as uuidv4 } from "uuid"
import browser from "webextension-polyfill"

import { getConfig } from "~config"
import { AccountType } from "~packages/account"
import { SimpleAccount } from "~packages/account/SimpleAccount"
import { ObservableStorage } from "~packages/storage/observable"
import address from "~packages/util/address"
import number from "~packages/util/number"

import type { State } from "./state"

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

    // TODO: Separate init process by environment

    // Load accounts into storage
    const account = state.account ?? {}
    const accountCount = Object.keys(account).length
    // Patch id and name for accounts
    Object.entries(account).forEach(([id, a], i) => {
      if (!a.id) {
        a.id = id
      }
      if (!a.name) {
        a.name = `Account ${i + 1}`
      }
    })
    config.accounts.forEach((a, i) => {
      const targetAccount = Object.values(account).find(
        (as) =>
          a.chainId === as.chainId && address.isEqual(a.address, as.address)
      ) ?? {
        id: uuidv4(),
        name: `Account ${accountCount + i + 1}`,
        transactionLog: {},
        balance: "0x00",
        tokens: []
      }
      Object.assign(account, {
        [targetAccount.id]: {
          ...targetAccount,
          ...a
        }
      })
    })

    // Load networks into storage
    // TODO: Consider to write id into network
    const network = state.network ?? {}
    // Patch id for networks
    Object.entries(network).forEach(([id, n]) => {
      n.id = id
    })
    let networkActive = state.networkActive
    config.networks.forEach((n) => {
      const targetNetwork = Object.values(network).find(
        (ns) => n.chainId === ns.chainId
      ) ?? {
        id: uuidv4(),
        accountActive: null
      }
      if (!targetNetwork.accountActive) {
        targetNetwork.accountActive = Object.entries(account)
          .map(([id, a]) => ({ id, ...a }))
          .filter((a) => a.chainId === n.chainId)[0]?.id
      }
      Object.assign(network, {
        [targetNetwork.id]: {
          ...targetNetwork,
          ...n
        }
      })
      if (n.active && !networkActive) {
        networkActive = targetNetwork.id
      }
    })

    // Initialize an account if it doesn't exist
    if (Object.keys(account).length === 0) {
      const initialChainId = 80002
      const wallet = Wallet.createRandom()
      const privateKey = wallet.privateKey

      const initialNetwork = Object.values(network).find(
        (n) => n.chainId === initialChainId
      )
      const factoryAddress = initialNetwork.accountFactory.SimpleAccount
      const salt = number.toHex(number.random())

      // Update networkActive id
      networkActive = initialNetwork.id

      const simpleAccount = await SimpleAccount.initWithFactory(
        new JsonRpcProvider(initialNetwork.nodeRpcUrl),
        {
          ownerPrivateKey: privateKey,
          factoryAddress,
          salt
        }
      )
      const accountId = uuidv4()

      Object.assign(account, {
        [accountId]: {
          id: accountId,
          name: "Account 1",
          transactionLog: {},
          balance: "0x00",
          tokens: [],
          type: AccountType.SimpleAccount,
          chainId: initialNetwork.chainId,
          address: await simpleAccount.getAddress(),
          ownerPrivateKey: privateKey,
          factoryAddress,
          salt
        }
      })

      // Update network's active id based on the initial account
      Object.assign(network, {
        [initialNetwork.id]: {
          ...initialNetwork,
          ...{ accountActive: accountId, active: true }
        }
      })
    }

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
