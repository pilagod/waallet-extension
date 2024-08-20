import type { AccountManager } from "~packages/account/manager"
import type { NetworkManager } from "~packages/network/manager"
import type { RequestPool } from "~packages/waallet/background/pool/request"
import { WaalletBackgroundProvider } from "~packages/waallet/background/provider"

let waalletBackgroundProvider: WaalletBackgroundProvider

export function getWaalletBackgroundProvider() {
  return waalletBackgroundProvider
}

export function setupWaalletBackgroundProvider(option: {
  accountManager: AccountManager
  networkManager: NetworkManager
  requestPool: RequestPool
}): WaalletBackgroundProvider {
  waalletBackgroundProvider = new WaalletBackgroundProvider(
    option.accountManager,
    option.networkManager,
    option.requestPool
  )
  return waalletBackgroundProvider
}
