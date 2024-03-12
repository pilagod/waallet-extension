import { BundlerMode, BundlerProvider } from "~packages/bundler/provider"
import { PopUpUserOperationAuthorizer } from "~packages/waallet/background/authorizer/userOperation/popup"
import { WaalletBackgroundProvider } from "~packages/waallet/background/provider"

let waalletBackgroundProvider: WaalletBackgroundProvider

export function getWaalletBackgroundProvider() {
  return waalletBackgroundProvider
}

export function setupWaalletBackgroundProvider(options: {
  nodeRpcUrl: string
  bundlerRpcUrl: string
}): WaalletBackgroundProvider {
  waalletBackgroundProvider = new WaalletBackgroundProvider(
    options.nodeRpcUrl,
    new BundlerProvider(options.bundlerRpcUrl, BundlerMode.Manual),
    new PopUpUserOperationAuthorizer()
  )
  return waalletBackgroundProvider
}
