import { v4 as uuidv4 } from "uuid"

import { UserOperation } from "~packages/bundler"
import { ObservableStorage } from "~packages/storage/observable"
import type {
  UserOperationPool,
  UserOperationReceipt
} from "~packages/waallet/background/pool/userOperation"
import { UserOperationStatus, type State } from "~storage/local"
import type { HexString } from "~typing"

export class UserOperationStoragePool implements UserOperationPool {
  public constructor(private storage: ObservableStorage<State>) {}

  public async send(data: {
    userOp: UserOperation
    senderId: string
    networkId: string
    entryPointAddress: HexString
  }) {
    const id = uuidv4()

    this.storage.set((state) => {
      state.pendingUserOpLog[id] = {
        id,
        createdAt: Math.floor(Date.now() / 1000), // Get current timestamp in seconds
        userOp: data.userOp.data(),
        senderId: data.senderId,
        networkId: data.networkId,
        entryPointAddress: data.entryPointAddress,
        status: UserOperationStatus.Pending
      }
    })

    return id
  }

  public wait(userOpId: string) {
    return new Promise<UserOperationReceipt>((resolve, reject) => {
      const { senderId } = this.storage.get().pendingUserOpLog[userOpId]
      const subscriber = async ({ account }: State) => {
        const userOpLog = account[senderId].userOpLog[userOpId]

        // Bundler is still processing this user operation
        if (userOpLog.status === UserOperationStatus.Sent) {
          return
        }

        this.storage.unsubscribe(subscriber)

        if (userOpLog.status === UserOperationStatus.Rejected) {
          reject(new Error("User rejects the user operation"))
          return
        }

        if (
          userOpLog.status === UserOperationStatus.Failed ||
          userOpLog.status === UserOperationStatus.Reverted
        ) {
          reject(new Error(userOpLog.receipt.errorMessage))
          return
        }

        resolve(userOpLog.receipt)
      }
      this.storage.subscribe(subscriber, {
        account: { [senderId]: { userOpLog: { [userOpId]: {} } } }
      })
    })
  }
}
