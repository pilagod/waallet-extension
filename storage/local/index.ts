import { v4 as uuidv4 } from "uuid"
import browser from "webextension-polyfill"

import { getConfig } from "~config"
import { Address } from "~packages/primitive"
import { ObservableStorage } from "~packages/storage/observable"
import { StateActor } from "~storage/local/actor"

import type { State } from "./state"

let storage: ObservableStorage<State>

export async function getLocalStorage() {
  if (!storage) {
    // TODO: Check browser.runtime.lastError
    const localStorage = await browser.storage.local.get(null)
    storage = new ObservableStorage<State>(
      Object.assign(
        // Empty state skeleton
        {
          networkActive: null,
          network: {},
          account: {},
          paymaster: {},
          request: {},
          requestLog: {}
        },
        localStorage
      )
    )
    storage.subscribe(async (state) => {
      console.log("[storage] Write state into storage")
      await browser.storage.local.set(state)
    })
    const state = storage.get()
    const stateActor = new StateActor(state)
    const config = getConfig()

    // TODO: Separate init process by environment

    // Load networks into storage
    // TODO: Consider to write id into network
    const network = state.network
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
      network[targetNetwork.id] = {
        ...targetNetwork,
        ...n
      }
      if (n.active && !networkActive) {
        networkActive = targetNetwork.id
      }
    })

    // Load accounts into storage
    const account = state.account
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
          a.chainId === as.chainId &&
          Address.wrap(a.address).isEqual(as.address)
      )
      if (!targetAccount) {
        stateActor.createAccount(
          { ...a, name: `Account ${accountCount + i + 1}` },
          a.chainId
        )
      } else {
        account[targetAccount.id] = {
          ...targetAccount,
          ...a
        }
      }
    })

    // Setup active account for networks if not presented
    Object.values(network).forEach((ns) => {
      if (!ns.accountActive) {
        ns.accountActive = Object.entries(account)
          .map(([id, a]) => ({ id, ...a }))
          .filter((a) => a.chainId === ns.chainId)[0]?.id
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
        request: {},
        requestLog: {}
      }
    })
  }
  return storage
}
