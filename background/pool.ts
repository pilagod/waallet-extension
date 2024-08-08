import { v4 as uuidv4 } from "uuid"

import { ObservableStorage } from "~packages/storage/observable"
import type {
  Request,
  RequestPool
} from "~packages/waallet/background/pool/request"
import {
  RequestType,
  TransactionStatus,
  type State
} from "~storage/local/state"

export class RequestStoragePool implements RequestPool {
  public constructor(private storage: ObservableStorage<State>) {}

  public async send(data: {
    request: Request
    accountId: string
    networkId: string
  }) {
    const { request, accountId, networkId } = data

    const id = uuidv4()

    this.storage.set((state) => {
      state.pendingRequests.push({
        type: RequestType.Transaction,
        id,
        createdAt: Date.now(),
        accountId,
        networkId,
        ...request.unwrap()
      })
    })

    return id
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
}
