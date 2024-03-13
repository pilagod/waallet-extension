import { PasskeyAccount } from "~packages/account/PasskeyAccount"
import { PasskeyOwnerWebAuthn } from "~packages/account/PasskeyAccount/passkeyOwnerWebAuthn"
import { SimpleAccount } from "~packages/account/SimpleAccount"

import { setupWaalletBackgroundProvider } from "./provider"
import { AccountType, getStorage, type Account, type Network } from "./storage"

console.log(
  "Live now; make now always the most precious time. Now will never come again."
)

async function main() {
  const storage = await getStorage()
  const state = storage.get()
  const network = Object.values(state.network).find((n) => n.selected)
  if (!network) {
    throw new Error("No available network")
  }
  const provider = setupWaalletBackgroundProvider({
    nodeRpcUrl: network.nodeRpcUrl,
    bundlerRpcUrl: network.bundlerRpcUrl
  })
  const [account] = Object.values(network.account)
  if (!account) {
    throw new Error("No available account")
  }
  provider.connect(await initAccount(account, network))
}

async function initAccount(account: Account, network: Network) {
  switch (account.type) {
    case AccountType.SimpleAccount:
      return SimpleAccount.init({
        address: account.address,
        ownerPrivateKey: account.ownerPrivateKey,
        nodeRpcUrl: network.nodeRpcUrl
      })
    case AccountType.PasskeyAccount:
      return PasskeyAccount.init({
        address: account.address,
        owner: new PasskeyOwnerWebAuthn(),
        nodeRpcUrl: network.nodeRpcUrl
      })
    default:
      throw new Error("Unknown account type")
  }
}

main()
