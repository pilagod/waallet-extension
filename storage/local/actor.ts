import address from "~packages/util/address"
import type { HexString } from "~typing"

import {
  RequestType,
  TransactionType,
  type Erc4337TransactionRejected,
  type Erc4337TransactionSent,
  type Request,
  type RequestLog,
  type RequestLogMeta,
  type State
} from "./state"

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

  public getErc4337TransactionType(networkId: string, entryPoint: HexString) {
    const network = this.state.network[networkId]
    if (address.isEqual(entryPoint, network.entryPoint["v0.6"])) {
      return TransactionType.Erc4337V0_6
    }
    return TransactionType.Erc4337V0_7
  }

  public resolveErc4337TransactionRequest<
    T extends Erc4337TransactionSent | Erc4337TransactionRejected
  >(requestId: string, data: Omit<T, keyof RequestLogMeta<{}> | "type">) {
    const request = this.getTransactionRequest(requestId)
    const log = this.createRequestLog(request, {
      status: this.getErc4337TransactionType(
        request.networkId,
        data.detail.entryPoint
      ),
      ...data
    })
    // TODO: Do not put rejected log into account
    this.state.account[log.accountId].transactionLog[log.id] = log
    delete this.state.pendingRequest[log.id]
  }

  public createRequestLog<T extends RequestLog>(
    request: Request,
    data: Omit<T, keyof RequestLogMeta<{}>>
  ): T {
    return {
      id: request.id,
      createdAt: request.createdAt,
      updatedAt: new Date().getTime(),
      accountId: request.accountId,
      networkId: request.networkId,
      ...data
    } as T
  }
}
