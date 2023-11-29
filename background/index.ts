import { PrivateKeyAccount } from "~packages/provider/waallet/background/account/privateKey"

import { setupWaalletBackgroundProvider } from "./provider"

console.log(
  "Live now; make now always the most precious time. Now will never come again."
)

const provider = setupWaalletBackgroundProvider({
  nodeRpcUrl: process.env.PLASMO_PUBLIC_NODE_RPC_URL,
  bundlerRpcUrl: process.env.PLASMO_PUBLIC_BUNDLER_RPC_URL
})
provider.connect(
  new PrivateKeyAccount(
    process.env.PLASMO_PUBLIC_ACCOUNT,
    process.env.PLASMO_PUBLIC_ACCOUNT_OWNER_PRIVATE_KEY
  )
)

export {}
