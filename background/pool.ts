import type { Patch } from "immer"
import { v4 as uuidv4 } from "uuid"

import { ObservableStorage } from "~packages/storage/observable"
import {
  Eip712Request,
  TransactionRequest,
  type Request,
  type RequestPool
} from "~packages/waallet/background/pool/request"
import {
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

  public wait(requestId: string) {
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
      const subscriber = async ({ account }: State) => {
        const txLog = account[request.accountId].transactionLog[request.id]

        // Bundler is still processing this user operation
        if (txLog.status === TransactionStatus.Sent) {
          return
        }

        this.storage.unsubscribe(subscriber)

        if (txLog.status === TransactionStatus.Rejected) {
          reject(new Error("User rejects the user operation"))
          return
        }

        if (
          txLog.status === TransactionStatus.Failed ||
          txLog.status === TransactionStatus.Reverted
        ) {
          reject(new Error(txLog.receipt.errorMessage))
          return
        }

        resolve(txLog.receipt.transactionHash)
      }

      this.storage.subscribe(subscriber, {
        account: {
          [request.accountId]: { transactionLog: { [request.id]: {} } }
        }
      })
    })
  }

  private waitForEip712(request: StorageEip712Request) {
    return new Promise<HexString>((resolve, reject) => {
      // TODO: Listen to request log
      const subscriber = async (_: State, patches: Patch[]) => {
        const [patch] = patches.filter(
          (p) => p.path[0] === "request" && p.path[1] === request.id
        )
        if (!patch || patch.op === "replace") {
          return
        }
        this.storage.unsubscribe(subscriber)

        if (patch.op === "remove") {
          reject(new Error("User rejects the signing request"))
          return
        }

        const { signature } = this.storage.get().request[
          request.id
        ] as StorageEip712Request

        resolve(signature)

        this.storage.set((state) => {
          delete state.request[request.id]
        })
      }

      this.storage.subscribe(subscriber, {
        request: { [request.id]: {} }
      })
    })
  }
}
