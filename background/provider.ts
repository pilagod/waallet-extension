import { BundlerMode, BundlerProvider } from "~packages/bundler/provider"
import { NodeProvider } from "~packages/node/provider"
import { NullPaymaster } from "~packages/paymaster/NullPaymaster"
import { PopUpUserOperationAuthorizer } from "~packages/waallet/background/authorizer/userOperation/popup"
import { UserOperationSender } from "~packages/waallet/background/pool/userOperation/sender"
import { WaalletBackgroundProvider } from "~packages/waallet/background/provider"

let waalletBackgroundProvider: WaalletBackgroundProvider

export function getWaalletBackgroundProvider() {
  return waalletBackgroundProvider
}

export function setupWaalletBackgroundProvider(option: {
  nodeRpcUrl: string
  bundlerRpcUrl: string
}): WaalletBackgroundProvider {
  const bundler = new BundlerProvider(option.bundlerRpcUrl, BundlerMode.Manual)

  waalletBackgroundProvider = new WaalletBackgroundProvider(
    new NodeProvider(option.nodeRpcUrl),
    bundler,
    new PopUpUserOperationAuthorizer(),
    new NullPaymaster(),
    new UserOperationSender(bundler, new PopUpUserOperationAuthorizer())
  )

  return waalletBackgroundProvider
}
