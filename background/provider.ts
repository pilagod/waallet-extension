import type { AccountManager } from "~packages/account/manager"
import { SingleAccountManager } from "~packages/account/manager/single"
import type { NetworkManager } from "~packages/network/manager"
import { NullPaymaster } from "~packages/paymaster/NullPaymaster"
import { PopUpUserOperationAuthorizer } from "~packages/waallet/background/authorizer/userOperation/popup"
import { UserOperationSender } from "~packages/waallet/background/pool/userOperation/sender"
import { WaalletBackgroundProvider } from "~packages/waallet/background/provider"

let waalletBackgroundProvider: WaalletBackgroundProvider

export function getWaalletBackgroundProvider() {
  return waalletBackgroundProvider
}

export function setupWaalletBackgroundProvider(option: {
  accountManager: AccountManager
  networkManager: NetworkManager
}): WaalletBackgroundProvider {
  waalletBackgroundProvider = new WaalletBackgroundProvider(
    option.accountManager,
    option.networkManager,
    new NullPaymaster(),
    new UserOperationSender(
      option.networkManager,
      new PopUpUserOperationAuthorizer()
    )
  )
  return waalletBackgroundProvider
}
