import { PasskeyAccount } from "~packages/account/PasskeyAccount"
import { PasskeyOwnerWebAuthn } from "~packages/account/PasskeyAccount/passkeyOwnerWebAuthn"
import { SimpleAccount } from "~packages/account/SimpleAccount"

import { setupWaalletBackgroundProvider } from "./provider"

console.log(
  "Live now; make now always the most precious time. Now will never come again."
)

const provider = setupWaalletBackgroundProvider({
  nodeRpcUrl: process.env.PLASMO_PUBLIC_NODE_RPC_URL,
  bundlerRpcUrl: process.env.PLASMO_PUBLIC_BUNDLER_RPC_URL
})

if (process.env.PLASMO_PUBLIC_ACCOUNT) {
  SimpleAccount.init({
    address: process.env.PLASMO_PUBLIC_ACCOUNT,
    ownerPrivateKey: process.env.PLASMO_PUBLIC_ACCOUNT_OWNER_PRIVATE_KEY,
    nodeRpcUrl: process.env.PLASMO_PUBLIC_NODE_RPC_URL
  }).then((account) => {
    provider.connect(account)
  })
} else if (process.env.PLASMO_PUBLIC_PASSKEY_ACCOUNT) {
  PasskeyAccount.init({
    address: process.env.PLASMO_PUBLIC_PASSKEY_ACCOUNT,
    owner: new PasskeyOwnerWebAuthn(),
    nodeRpcUrl: process.env.PLASMO_PUBLIC_NODE_RPC_URL
  }).then((account) => {
    provider.connect(account)
  })
}

export {}
