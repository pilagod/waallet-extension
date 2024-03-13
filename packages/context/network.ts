import * as ethers from "ethers"

import { BundlerProvider } from "~packages/bundler/provider"

export type NetworkContext = {
  node: ethers.JsonRpcProvider
  bundler: BundlerProvider
}
