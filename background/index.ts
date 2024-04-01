import browser from "webextension-polyfill"

import { PasskeyAccount } from "~packages/account/PasskeyAccount"
import { PasskeyOwnerWebAuthn } from "~packages/account/PasskeyAccount/passkeyOwnerWebAuthn"
import { SimpleAccount } from "~packages/account/SimpleAccount"
import { NetworkManager } from "~packages/network/manager"
import type { ContractRunner } from "~packages/node"

import { setupWaalletBackgroundProvider } from "./provider"
import { AccountType, getStorage, type Account } from "./storage"

console.log(
  "Live now; make now always the most precious time. Now will never come again."
)

async function main() {
  const storage = await getStorage()
  const state = storage.get()
  const network = state.network[state.networkActive]
  if (!network) {
    throw new Error("No available network")
  }
  const networkManager = new NetworkManager(storage)
  const provider = setupWaalletBackgroundProvider(networkManager)
  const account = state.account[network.accountActive]
  if (!account) {
    throw new Error("No available account")
  }
  const { node } = networkManager.getActive()
  provider.connect(await initAccount(node, account))
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
