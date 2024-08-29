import type { UserOperation } from "~packages/bundler/userOperation"
import { Address } from "~packages/primitive"
import type { HexString } from "~typing"

import {
  Eip712Status,
  RequestType,
  TransactionStatus,
  TransactionType,
  type Erc4337TransactionFailedData,
  type Erc4337TransactionLog,
  type Erc4337TransactionRejectedData,
  type Erc4337TransactionRevertedData,
  type Erc4337TransactionSentData,
  type Erc4337TransactionSucceededData,
  type Request,
  type State
} from "./state"

export type Erc4337TransactionResolveData = {
  detail: {
    entryPoint: Address
    userOp: UserOperation
  }
} & (
  | Erc4337TransactionRejectedData
  | Erc4337TransactionSentData
  | Erc4337TransactionFailedData
)

export type Erc4337TransactionTransitData =
  | Erc4337TransactionSucceededData
  | Erc4337TransactionRevertedData

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

  public getErc4337TransactionType(networkId: string, entryPoint: Address) {
    const network = this.state.network[networkId]
    if (entryPoint.isEqual(network.entryPoint["v0.6"])) {
      return TransactionType.Erc4337V0_6
    }
    return TransactionType.Erc4337V0_7
  }

  public resolveErc4337TransactionRequest(
    requestId: string,
    data: Erc4337TransactionResolveData
  ) {
    const {
      detail: { entryPoint, userOp },
      ...resolveData
    } = data
    const request = this.getTransactionRequest(requestId)
    const log = {
      ...resolveData,
      ...this.createRequestLogMeta(request),
      type: this.getErc4337TransactionType(request.networkId, entryPoint),
      detail: {
        entryPoint: entryPoint.toString(),
        data: userOp.unwrap()
      }
    } as Erc4337TransactionLog
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

  public transitErc4337TransactionLog(
    requestId: string,
    data: Erc4337TransactionTransitData
  ) {
    const { requestType, ...log } = this.getTransactionLog(requestId)
    const logTransitted = { ...log, ...data } as Erc4337TransactionLog
    this.state.account[log.accountId].transactionLog[log.id] = logTransitted
    this.state.requestLog[log.id] = { ...logTransitted, requestType }
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
