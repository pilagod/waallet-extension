import { PasskeyAccount } from "~packages/account/PasskeyAccount"
import { PasskeyOwnerWebAuthn } from "~packages/account/PasskeyAccount/passkeyOwnerWebAuthn"
import { SimpleAccount } from "~packages/account/SimpleAccount"
import type { NetworkManager } from "~packages/network"

import { NetworkStorageManager } from "./manager"
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
  const account = state.account[network.accountActive]
  if (!account) {
    throw new Error("No available account")
  }
  const networkManager = new NetworkStorageManager(storage)
  const provider = setupWaalletBackgroundProvider(networkManager)
  provider.connect(await initAccount(networkManager, account))
}

async function initAccount(networkManager: NetworkManager, account: Account) {
  const { node } = networkManager.getActive()

  switch (account.type) {
    case AccountType.SimpleAccount:
      return SimpleAccount.init({
        address: account.address,
        ownerPrivateKey: account.ownerPrivateKey
      })
    case AccountType.PasskeyAccount:
      return PasskeyAccount.init(node, {
        address: account.address,
        owner: new PasskeyOwnerWebAuthn()
      })
    default:
      throw new Error("Unknown account type")
  }
}

main()
