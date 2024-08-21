import { RequestType, type State } from "./state"

/**
 * @dev StateActor mutates the state in-place, which can work with zustand and immer seamlessly.
 */
export class StateActor {
  public constructor(private state: State) {}

  public getTransactionRequest(requestId: string) {
    const request = this.state.pendingRequest[requestId]
    if (!request || request.type !== RequestType.Transaction) {
      throw new Error(`Transaction request ${request.id} not found`)
    }
    return request
  }

  public getEip712Request(requestId: string) {
    const request = this.state.pendingRequest[requestId]
    if (!request || request.type !== RequestType.Eip712) {
      throw new Error(`EIP-712 request ${request.id} not found`)
    }
    return request
  }
}
