import {
  BundlerMode,
  BundlerProvider
} from "~packages/provider/bundler/provider"
import { NullUserOperationAuthorizer } from "~packages/provider/waallet/background/authorizer/userOperation/null"
import { WaalletBackgroundProvider } from "~packages/provider/waallet/background/provider"

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
    new NullUserOperationAuthorizer()
  )
  return waalletBackgroundProvider
}
