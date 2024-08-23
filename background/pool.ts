import { v4 as uuidv4 } from "uuid"

import { ObservableStorage } from "~packages/storage/observable"
import {
  Eip712Request,
  TransactionRequest,
  type Request,
  type RequestPool
} from "~packages/waallet/background/pool/request"
import { StateActor } from "~storage/local/actor"
import {
  Eip712Status,
  RequestType,
  TransactionStatus,
  type State,
  type Eip712Request as StorageEip712Request,
  type Request as StorageRequest,
  type TransactionRequest as StorageTransactionRequest
} from "~storage/local/state"
import type { HexString } from "~typing"

export class RequestStoragePool implements RequestPool {
  public constructor(private storage: ObservableStorage<State>) {}

  public async send(data: {
    request: Request
    accountId: string
    networkId: string
  }) {
    const request = this.transformToStorageRequest(data)

    this.storage.set((state) => {
      state.request[request.id] = request
    })

    return request.id
  }

  public async wait(requestId: string) {
    const request = this.storage.get().request[requestId]
    if (!request) {
      throw new Error(`Request ${request.id} not found`)
    }
    if (request.type === RequestType.Transaction) {
      return this.waitForTransaction(request)
    }
    if (request.type === RequestType.Eip712) {
      return this.waitForEip712(request)
    }
    throw new Error(`Unknown request type ${(request as any).type}`)
  }

  /* private */

  private transformToStorageRequest(data: {
    request: Request
    accountId: string
    networkId: string
  }): StorageRequest {
    const { request, accountId, networkId } = data
    const meta = {
      id: uuidv4(),
      createdAt: Date.now(),
      accountId,
      networkId
    }
    if (request instanceof TransactionRequest) {
      return { type: RequestType.Transaction, ...meta, ...request.unwrap() }
    }
    if (request instanceof Eip712Request) {
      return { type: RequestType.Eip712, ...meta, ...request.typedData }
    }
    throw new Error(`Unknown request type ${request}`)
  }

  private waitForTransaction(request: StorageTransactionRequest) {
    return new Promise<HexString>((resolve, reject) => {
      const subscriber = async (state: State) => {
        const log = new StateActor(state).getTransactionLog(request.id)

        // Bundler is still processing this user operation
        if (log.status === TransactionStatus.Sent) {
          return
        }

        this.storage.unsubscribe(subscriber)
        this.storage.set((state) => {
          delete state.requestLog[request.id]
        })

        if (log.status === TransactionStatus.Rejected) {
          reject(new Error("User rejects the user operation"))
          return
        }

        if (
          log.status === TransactionStatus.Failed ||
          log.status === TransactionStatus.Reverted
        ) {
          reject(new Error(log.receipt.errorMessage))
          return
        }

        resolve(log.receipt.transactionHash)
      }

      this.storage.subscribe(subscriber, {
        requestLog: { [request.id]: {} }
      })
    })
  }

  private waitForEip712(request: StorageEip712Request) {
    return new Promise<HexString>((resolve, reject) => {
      const subscriber = async (state: State) => {
        const log = new StateActor(state).getEip712Log(request.id)

        this.storage.unsubscribe(subscriber)
        this.storage.set((state) => {
          delete state.requestLog[request.id]
        })

        if (log.status === Eip712Status.Rejected) {
          reject(new Error("User rejects the signing request"))
          return
        }
        resolve(log.signature)
      }

      this.storage.subscribe(subscriber, {
        requestLog: { [request.id]: {} }
      })
    })
  }
}
