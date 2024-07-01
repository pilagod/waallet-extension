import { v4 as uuidv4 } from "uuid"
import browser from "webextension-polyfill"

import { getConfig } from "~config"
import { ObservableStorage } from "~packages/storage/observable"
import address from "~packages/util/address"

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
    // TODO: Consider to write id into account
    const account = state.account ?? {}
    config.accounts.forEach((a) => {
      const targetAccount = Object.entries(account)
        .map(([id, as]) => ({ id, ...as }))
        .find(
          (as) =>
            a.chainId === as.chainId && address.isEqual(a.address, as.address)
        ) ?? { id: uuidv4(), transactionLog: {}, balance: "0x00", tokens: [] }
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
    let networkActive = state.networkActive
    config.networks.forEach((n) => {
      const targetNetwork = Object.entries(network)
        .map(([id, ns]) => ({ id, ...ns }))
        .find((ns) => n.chainId === ns.chainId) ?? {
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
