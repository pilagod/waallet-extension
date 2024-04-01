import { NetworkManager } from "~packages/network/manager"
import { NullPaymaster } from "~packages/paymaster/NullPaymaster"
import { PopUpUserOperationAuthorizer } from "~packages/waallet/background/authorizer/userOperation/popup"
import { UserOperationSender } from "~packages/waallet/background/pool/userOperation/sender"
import { WaalletBackgroundProvider } from "~packages/waallet/background/provider"

let waalletBackgroundProvider: WaalletBackgroundProvider

export function getWaalletBackgroundProvider() {
  return waalletBackgroundProvider
}

export function setupWaalletBackgroundProvider(
  networkManager: NetworkManager
): WaalletBackgroundProvider {
  const { bundler } = networkManager.getActive()

  waalletBackgroundProvider = new WaalletBackgroundProvider(
    networkManager,
    new NullPaymaster(),
    new UserOperationSender(bundler, new PopUpUserOperationAuthorizer())
  )
  return waalletBackgroundProvider
}
