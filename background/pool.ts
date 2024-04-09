import { v4 as uuidv4 } from "uuid"

import { UserOperation } from "~packages/bundler"
import { ObservableStorage } from "~packages/storage/observable"
import type {
  UserOperationPool,
  UserOperationReceipt
} from "~packages/waallet/background/pool/userOperation"
import type { HexString } from "~typing"

import { UserOperationStatus, type State } from "./storage"

export class UserOperationStoragePool implements UserOperationPool {
  public constructor(private storage: ObservableStorage<State>) {}

  public async send(data: {
    userOp: UserOperation
    senderId: string
    networkId: string
    entryPointAddress: HexString
  }) {
    const id = uuidv4()

    this.storage.set((draft) => {
      draft.userOperationPool[id] = {
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
      const subscriber = async ({ userOperationPool }: State) => {
        const userOp = userOperationPool[userOpId]
        if (userOp.status === UserOperationStatus.Pending) {
          return
        }
        if (userOp.status === UserOperationStatus.Failed) {
          reject(userOp.receipt.errorMessage)
          return
        }
        resolve(userOp.receipt)
      }
      this.storage.subscribe(subscriber, ["userOperationPool", userOpId])
    })
  }
}
