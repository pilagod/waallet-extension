import { v4 as uuidV4 } from "uuid"

import address from "~packages/util/address"
import number from "~packages/util/number"
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
  type PasskeyAccountData,
  type Request,
  type RequestLogMeta,
  type SimpleAccountData,
  type State
} from "./state"

export type NetworkId = string /* uuid */ | number /* chain id */

/**
 * @dev StateActor mutates the state in-place, which can work with zustand and immer seamlessly.
 */
export class StateActor {
  public constructor(private state: State) {}

  /* Network */

  public getNetwork(networkId: NetworkId) {
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
    const logTransitted = { ...log, ...data }
    this.state.account[log.accountId].transactionLog[log.id] = logTransitted
    this.state.requestLog[log.id] = logTransitted
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
