import { BundlerMode, BundlerProvider } from "~packages/bundler/provider"
import { NodeProvider } from "~packages/node/provider"
import { PopUpUserOperationAuthorizer } from "~packages/waallet/background/authorizer/userOperation/popup"
import { WaalletBackgroundProvider } from "~packages/waallet/background/provider"

let waalletBackgroundProvider: WaalletBackgroundProvider

export function getWaalletBackgroundProvider() {
  return waalletBackgroundProvider
}

export function setupWaalletBackgroundProvider(option: {
  nodeRpcUrl: string
  bundlerRpcUrl: string
}): WaalletBackgroundProvider {
  waalletBackgroundProvider = new WaalletBackgroundProvider(
    new NodeProvider(option.nodeRpcUrl),
    new BundlerProvider(option.bundlerRpcUrl, BundlerMode.Manual),
    new PopUpUserOperationAuthorizer()
  )
  return waalletBackgroundProvider
}
