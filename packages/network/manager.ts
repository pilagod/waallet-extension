import { BundlerProvider } from "~packages/bundler/provider"
import { NodeProvider } from "~packages/node/provider"
import { ObservableStorage } from "~packages/storage/observable"

export type Network = {
  id: string
  chainId: number
  node: NodeProvider
  bundler: BundlerProvider
}

export class NetworkManager {
  public constructor(
    // TODO: Consider to use a more general interface
    public storage: ObservableStorage<{
      networkActive: string
      network: {
        [id: string]: {
          chainId: number
          nodeRpcUrl: string
          bundlerRpcUrl: string
        }
      }
    }>
  ) {}

  public get(id: string): Network {
    const { network } = this.storage.get()
    const target = network[id]
    if (!target) {
      throw new Error(`Unknown network ${id}`)
    }
    return {
      id,
      chainId: target.chainId,
      node: new NodeProvider(target.nodeRpcUrl),
      bundler: new BundlerProvider(target.bundlerRpcUrl)
    }
  }

  public getActive(): Network {
    const { networkActive } = this.storage.get()
    return this.get(networkActive)
  }
}
