import type { AccountManager } from "~packages/account/manager"
import type { NetworkManager } from "~packages/network/manager"
import type { TransactionPool } from "~packages/waallet/background/pool/transaction"
import { WaalletBackgroundProvider } from "~packages/waallet/background/provider"

let waalletBackgroundProvider: WaalletBackgroundProvider

export function getWaalletBackgroundProvider() {
  return waalletBackgroundProvider
}

export function setupWaalletBackgroundProvider(option: {
  accountManager: AccountManager
  networkManager: NetworkManager
  transactionPool: TransactionPool
}): WaalletBackgroundProvider {
  waalletBackgroundProvider = new WaalletBackgroundProvider(
    option.accountManager,
    option.networkManager,
    option.transactionPool
  )
  return waalletBackgroundProvider
}
