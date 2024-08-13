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
  type Request as PendingRequest,
  type State
} from "~storage/local/state"

export class RequestStoragePool implements RequestPool {
  public constructor(private storage: ObservableStorage<State>) {}

  public async send(data: {
    request: Request
    accountId: string
    networkId: string
  }) {
    const request = this.transformPendingRequest(data)

    this.storage.set((state) => {
      state.pendingRequests.push(request)
    })

    return request.id
  }

  public wait(txId: string) {
    return new Promise<string>((resolve, reject) => {
      // TODO: What if transaction not found?
      const [tx] = this.storage
        .get()
        .pendingRequests.filter(
          (r) => r.type === RequestType.Transaction && r.id === txId
        )
      const subscriber = async ({ account }: State) => {
        const txLog = account[tx.accountId].transactionLog[txId]

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
        account: { [tx.accountId]: { transactionLog: { [txId]: {} } } }
      })
    })
  }

  /* private */

  private transformPendingRequest(data: {
    request: Request
    accountId: string
    networkId: string
  }): PendingRequest {
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
      return { type: RequestType.Eip712, ...meta, ...request.unwrap() }
    }
    throw new Error(`Unknown request type ${request}`)
  }
}
