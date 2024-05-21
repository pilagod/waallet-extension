import type { AccountManager } from "~packages/account/manager"
import type { NetworkManager } from "~packages/network/manager"
import type { UserOperationPool } from "~packages/waallet/background/pool/userOperation"
import { WaalletBackgroundProvider } from "~packages/waallet/background/provider"

let waalletBackgroundProvider: WaalletBackgroundProvider

export function getWaalletBackgroundProvider() {
  return waalletBackgroundProvider
}

export function setupWaalletBackgroundProvider(option: {
  accountManager: AccountManager
  networkManager: NetworkManager
  userOpPool: UserOperationPool
}): WaalletBackgroundProvider {
  waalletBackgroundProvider = new WaalletBackgroundProvider(
    option.accountManager,
    option.networkManager,
    option.userOpPool
  )
  return waalletBackgroundProvider
}
