import address from "~packages/util/address"
import type { HexString } from "~typing"

import {
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
    const request = this.state.request[requestId]
    if (!request || request.type !== RequestType.Transaction) {
      throw new Error(`Transaction request ${request.id} not found`)
    }
    return request
  }

  public getTransactionLog(requestId: string) {
    const log = this.state.requestLog[requestId]
    if (!log || log.requestType !== RequestType.Transaction) {
      throw new Error(`Transaction request ${log.id} not found`)
    }
    return log
  }

  public getEip712Request(requestId: string) {
    const request = this.state.request[requestId]
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
    T extends
      | Erc4337TransactionRejected
      | Erc4337TransactionSent
      | Erc4337TransactionFailed
  >(requestId: string, data: Omit<T, keyof RequestLogMeta | "type">) {
    const request = this.getTransactionRequest(requestId)
    const log = this.createRequestLog(request, {
      ...data,
      type: this.getErc4337TransactionType(
        request.networkId,
        data.detail.entryPoint
      )
    } as T)
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

  /* private */

  private createRequestLog<T extends RequestLog>(
    request: Request,
    data: Omit<T, keyof RequestLogMeta>
  ): T {
    return {
      ...data,
      id: request.id,
      createdAt: request.createdAt,
      updatedAt: new Date().getTime(),
      accountId: request.accountId,
      networkId: request.networkId
    } as T
  }
}
