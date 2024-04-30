import { v4 as uuidv4 } from "uuid"

import type { AccountManager } from "~packages/account/manager"
import { UserOperation } from "~packages/bundler"
import type { NetworkManager } from "~packages/network/manager"
import type { HexString } from "~typing"

import type { UserOperationPool, UserOperationReceipt } from "./index"

export class UserOperationSender implements UserOperationPool {
  private pool: { [userOpHash: HexString]: Promise<UserOperationReceipt> } = {}

  public constructor(
    private accountManager: AccountManager,
    private networkManager: NetworkManager,
    private userOpHook?: (userOp: UserOperation) => Promise<void>
  ) {}

  public async send(data: {
    userOp: UserOperation
    senderId: string
    networkId: string
    entryPointAddress: HexString
  }) {
    const { userOp, senderId, networkId, entryPointAddress } = data
    const { bundler, chainId } = this.networkManager.get(networkId)
    const { account } = await this.accountManager.get(senderId)
    if (this.userOpHook) {
      await this.userOpHook(userOp)
    }
    userOp.setSignature(
      await account.sign(userOp.hash(entryPointAddress, chainId))
    )
    // const userOpAuthorized = await this.userOperationAuthorizer.authorize(
    //   userOp,
    //   {
    //     onApproved: async (userOpAuthorized, metadata) => {
    //       const { account } = await this.accountManager.get(senderId)
    //       userOpAuthorized.setSignature(
    //         await account.sign(
    //           userOpAuthorized.hash(entryPointAddress, chainId),
    //           metadata
    //         )
    //       )
    //       return userOpAuthorized
    //     }
    //   }
    // )
    const userOpHash = await bundler.sendUserOperation(
      userOp,
      entryPointAddress
    )
    if (!userOpHash) {
      throw new Error("Send user operation fail")
    }
    const id = uuidv4()

    this.pool[id] = new Promise(async (resolve) => {
      const transactionHash = await bundler.wait(userOpHash)
      resolve({
        userOpHash: userOpHash,
        transactionHash
      })
    })

    return id
  }

  public wait(userOpId: string) {
    return this.pool[userOpId]
  }
}
