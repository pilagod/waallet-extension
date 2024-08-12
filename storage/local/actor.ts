import { RequestType, type State } from "./state"

/**
 * @dev StateActor mutates the state in-place, which can work with zustand and immer seamlessly.
 */
export class StateActor {
  public constructor(private state: State) {}

  public getTranasctionRequest(requestId: string) {
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
