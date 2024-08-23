import { v4 as uuidV4 } from "uuid"

import number from "~packages/util/number"

import {
  RequestType,
  type PasskeyAccountData,
  type SimpleAccountData,
  type State
} from "./state"

/**
 * @dev StateActor mutates the state in-place, which can work with zustand and immer seamlessly.
 */
export class StateActor {
  public constructor(private state: State) {}

  /* Network */

  /**
   * @param networkId uuid or chain id
   */
  public getNetwork(networkId: string | number) {
    if (typeof networkId === "string") {
      const network = this.state.network[networkId]
      if (!network) {
        throw new Error(`Network with id ${networkId} not found`)
      }
      return network
    }
    const [network] = Object.values(this.state.network).filter(
      (n) => n.chainId === networkId
    )
    if (!network) {
      throw new Error(`Network with chain id ${networkId} not found`)
    }
    return network
  }

  /* Account */

  public createAccount(
    account: (SimpleAccountData | PasskeyAccountData) & { name: string },
    networkId: string | number
  ) {
    const id = uuidV4()
    const network = this.getNetwork(networkId)
    this.state.account[id] = {
      ...account,
      id,
      chainId: network.chainId,
      transactionLog: {},
      balance: number.toHex(0),
      tokens: []
    }
    network.accountActive = id
  }

  /* Request */

  public getTransactionRequest(requestId: string) {
    const [tx] = this.state.pendingRequests.filter(
      (r) => r.type === RequestType.Transaction && r.id === requestId
    )
    if (!tx) {
      throw new Error(`Transaction request ${requestId} not found`)
    }
    return tx
  }

  public resolveTransactionRequest(requestId: string) {
    const txIndex = this.state.pendingRequests.findIndex(
      (r) => r.type === RequestType.Transaction && r.id === requestId
    )
    if (txIndex < 0) {
      throw new Error(`Transaction request ${requestId} not found`)
    }
    this.state.pendingRequests.splice(txIndex, 1)
  }
}
