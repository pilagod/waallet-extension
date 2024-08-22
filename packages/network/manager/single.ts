import { v4 as uuidv4 } from "uuid"

import {
  BundlerMode,
  BundlerProvider
} from "~packages/eip/4337/bundler/provider"
import type { NetworkManager } from "~packages/network/manager"
import { NodeProvider } from "~packages/node/provider"

export class SingleNetworkManager implements NetworkManager {
  private id = uuidv4()
  private chainId: number
  private node: NodeProvider
  private bundler: BundlerProvider

  public constructor(option: {
    chainId: number
    node: NodeProvider
    bundler: BundlerProvider
  }) {
    this.chainId = option.chainId
    this.node = option.node
    this.bundler = option.bundler
  }

  public get(id: string) {
    if (id !== this.id) {
      throw new Error(`Unknown network ${id}`)
    }
    return {
      id: this.id,
      chainId: this.chainId,
      node: this.node,
      bundler: this.bundler
    }
  }

  public getActive() {
    return this.get(this.id)
  }
}
