import { BundlerProvider } from "~packages/eip/4337/bundler/provider"
import { NodeProvider } from "~packages/node/provider"

export type Network = {
  id: string
  chainId: number
  node: NodeProvider
  bundler: BundlerProvider
}

export interface NetworkManager {
  get(id: string): Network
  getActive(): Network
}
