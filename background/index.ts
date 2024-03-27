import browser from "webextension-polyfill"

import { PasskeyAccount } from "~packages/account/PasskeyAccount"
import { PasskeyOwnerWebAuthn } from "~packages/account/PasskeyAccount/passkeyOwnerWebAuthn"
import { SimpleAccount } from "~packages/account/SimpleAccount"
import type { ContractRunner } from "~packages/node"

import { setupWaalletBackgroundProvider } from "./provider"
import { AccountType, getStorage, StorageAction, type Account } from "./storage"

console.log(
  "Live now; make now always the most precious time. Now will never come again."
)

async function main() {
  const storage = await getStorage()
  storage.subscribe(async (state) => {
    console.log("[background] Sync state to popup")
    await browser.runtime.sendMessage(browser.runtime.id, {
      action: StorageAction.Sync,
      state
    })
  })
  const state = storage.get()
  const network = state.network[state.networkActive]
  if (!network) {
    throw new Error("No available network")
  }
  const provider = setupWaalletBackgroundProvider({
    nodeRpcUrl: network.nodeRpcUrl,
    bundlerRpcUrl: network.bundlerRpcUrl
  })
  const account = state.account[network.accountActive]
  if (!account) {
    throw new Error("No available account")
  }
  provider.connect(await initAccount(provider.node, account))
}

async function initAccount(runner: ContractRunner, account: Account) {
  switch (account.type) {
    case AccountType.SimpleAccount:
      return SimpleAccount.init({
        address: account.address,
        ownerPrivateKey: account.ownerPrivateKey
      })
    case AccountType.PasskeyAccount:
      return PasskeyAccount.init(runner, {
        address: account.address,
        owner: new PasskeyOwnerWebAuthn()
      })
    default:
      throw new Error("Unknown account type")
  }
}

main()
