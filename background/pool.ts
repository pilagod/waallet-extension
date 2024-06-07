import { v4 as uuidv4 } from "uuid"

import { ObservableStorage } from "~packages/storage/observable"
import type {
  Transaction,
  TransactionPool
} from "~packages/waallet/background/pool/transaction"
import { TransactionStatus, type State } from "~storage/local"

export class TransactionStoragePool implements TransactionPool {
  public constructor(private storage: ObservableStorage<State>) {}

  public async send(data: {
    tx: Transaction
    senderId: string
    networkId: string
  }) {
    const { tx, senderId, networkId } = data
    const id = uuidv4()

    this.storage.set((state) => {
      state.pendingTransaction[id] = {
        id,
        status: TransactionStatus.Pending,
        createdAt: Math.floor(Date.now() / 1000), // Get current timestamp in seconds
        senderId,
        networkId,
        ...tx.data()
      }
    })

    return id
  }

  public wait(txId: string) {
    return new Promise<string>((resolve, reject) => {
      const { senderId } = this.storage.get().pendingTransaction[txId]

      const subscriber = async ({ account }: State) => {
        const txLog = account[senderId].transactionLog[txId]

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
        account: { [senderId]: { transactionLog: { [txId]: {} } } }
      })
    })
  }
}
