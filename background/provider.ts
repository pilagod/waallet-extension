import {
  BundlerMode,
  BundlerProvider
} from "~packages/provider/bundler/provider"
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
    new BundlerProvider(options.bundlerRpcUrl, BundlerMode.Manual)
  )
  return waalletBackgroundProvider
}
