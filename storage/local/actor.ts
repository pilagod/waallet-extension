import address from "~packages/util/address"
import type { HexString } from "~typing"

import {
  Eip712Status,
  RequestType,
  TransactionStatus,
  TransactionType,
  type Erc4337TransactionFailed,
  type Erc4337TransactionLogMeta,
  type Erc4337TransactionRejected,
  type Erc4337TransactionReverted,
  type Erc4337TransactionSent,
  type Erc4337TransactionSucceeded,
  type Request,
  type RequestLogMeta,
  type State
} from "./state"

/**
 * @dev StateActor mutates the state in-place, which can work with zustand and immer seamlessly.
 */
export class StateActor {
  public constructor(private state: State) {}

  /* Transaction Request */

  public getTransactionRequest(requestId: string) {
    const request = this.state.request[requestId]
    if (!request || request.type !== RequestType.Transaction) {
      throw new Error(`Transaction request ${requestId} not found`)
    }
    return request
  }

  public getTransactionLog(requestId: string) {
    const log = this.state.requestLog[requestId]
    if (!log || log.requestType !== RequestType.Transaction) {
      throw new Error(`Transaction request log ${requestId} not found`)
    }
    return log
  }

  public getErc4337TransactionType(networkId: string, entryPoint: HexString) {
    const network = this.state.network[networkId]
    if (address.isEqual(entryPoint, network.entryPoint["v0.6"])) {
      return TransactionType.Erc4337V0_6
    }
    return TransactionType.Erc4337V0_7
  }

  public resolveErc4337TransactionRequest<
    T extends
      | Erc4337TransactionRejected
      | Erc4337TransactionSent
      | Erc4337TransactionFailed
  >(requestId: string, data: Omit<T, keyof RequestLogMeta | "type">) {
    const request = this.getTransactionRequest(requestId)
    const log = {
      ...data,
      ...this.createRequestLogMeta(request),
      type: this.getErc4337TransactionType(
        request.networkId,
        data.detail.entryPoint
      )
    } as T
    // TODO: Handle failed status
    if (log.status !== TransactionStatus.Rejected) {
      this.state.account[log.accountId].transactionLog[log.id] = log
    }
    this.state.requestLog[log.id] = {
      ...log,
      requestType: RequestType.Transaction
    }
    delete this.state.request[log.id]
  }

  public transitErc4337TransactionLog<
    T extends Erc4337TransactionSucceeded | Erc4337TransactionReverted
  >(requestId: string, data: Omit<T, keyof Erc4337TransactionLogMeta>) {
    const log = this.getTransactionLog(requestId)
    const next = { ...log, ...data }
    this.state.account[log.accountId].transactionLog[log.id] = next
    this.state.requestLog[log.id] = next
  }

  /* EIP-712 Request */

  public getEip712Request(requestId: string) {
    const request = this.state.request[requestId]
    if (!request || request.type !== RequestType.Eip712) {
      throw new Error(`EIP-712 request ${request.id} not found`)
    }
    return request
  }

  public getEip712Log(requestId: string) {
    const log = this.state.requestLog[requestId]
    if (!log || log.requestType !== RequestType.Eip712) {
      throw new Error(`EIP-712 request log ${requestId} not found`)
    }
    return log
  }

  public rejectEip712Request(requestId: string) {
    const request = this.getEip712Request(requestId)
    this.state.requestLog[requestId] = {
      ...this.createRequestLogMeta(request),
      requestType: RequestType.Eip712,
      status: Eip712Status.Rejected
    }
    delete this.state.request[requestId]
  }

  public resolveEip712Request(requestId: string, signature: HexString) {
    const request = this.getEip712Request(requestId)
    this.state.requestLog[requestId] = {
      ...this.createRequestLogMeta(request),
      requestType: RequestType.Eip712,
      status: Eip712Status.Resolved,
      signature
    }
    delete this.state.request[requestId]
  }

  /* private */

  private createRequestLogMeta(request: Request) {
    return {
      id: request.id,
      createdAt: request.createdAt,
      updatedAt: new Date().getTime(),
      accountId: request.accountId,
      networkId: request.networkId
    }
  }
}
