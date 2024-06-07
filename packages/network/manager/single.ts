import { v4 as uuidv4 } from "uuid"

import { BundlerMode, BundlerProvider } from "~packages/bundler/provider"
import type { NetworkManager } from "~packages/network/manager"
import { NodeProvider } from "~packages/node/provider"

export class SingleNetworkManager implements NetworkManager {
  public constructor(
    private network: {
      id?: string
      chaindId: number
      nodeRpcUrl: string
      bundlerRpcUrl: string
    }
  ) {
    if (!this.network.id) {
      this.network.id = uuidv4()
    }
  }

  public get(id: string) {
    if (id !== this.network.id) {
      throw new Error(`Unknown network ${id}`)
    }
    return {
      id: this.network.id,
      chainId: this.network.chaindId,
      node: new NodeProvider(this.network.nodeRpcUrl),
      bundler: new BundlerProvider(
        this.network.bundlerRpcUrl,
        BundlerMode.Manual
      )
    }
  }

  public getActive() {
    return this.get(this.network.id)
  }
}
