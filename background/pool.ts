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
      state.userOpPool[id] = {
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
      const subscriber = async ({ userOpPool }: State) => {
        const userOp = userOpPool[userOpId]

        if (userOp.status === UserOperationStatus.Pending) {
          return
        }

        if (userOp.status === UserOperationStatus.Succeeded) {
          resolve(userOp.receipt)
          this.storage.unsubscribe(subscriber)
          return
        }

        if (userOp.status === UserOperationStatus.Failed) {
          reject(userOp.receipt.errorMessage)
          this.storage.unsubscribe(subscriber)
          return
        }
      }
      this.storage.subscribe(subscriber, { userOpPool: { [userOpId]: {} } })
    })
  }
}
