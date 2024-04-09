import { BundlerMode, BundlerProvider } from "~packages/bundler/provider"
import type { NetworkManager } from "~packages/network"
import { NodeProvider } from "~packages/node/provider"
import { ObservableStorage } from "~packages/storage/observable"

import type { State } from "./storage"

export class NetworkStorageManager implements NetworkManager {
  public constructor(private storage: ObservableStorage<State>) {}

  public get(id: string) {
    const { network } = this.storage.get()
    const target = network[id]
    if (!target) {
      throw new Error(`Unknown network ${id}`)
    }
    return {
      id,
      chainId: target.chainId,
      node: new NodeProvider(target.nodeRpcUrl),
      bundler: new BundlerProvider(
        target.bundlerRpcUrl,
        this.isLocalTestnet(target.chainId)
          ? BundlerMode.Manual
          : BundlerMode.Auto
      )
    }
  }

  public getActive() {
    const { networkActive } = this.storage.get()
    return this.get(networkActive)
  }

  private isLocalTestnet(chainId: number) {
    return chainId === 1337
  }
}
