import type { AccountManager } from "~packages/account/manager"
import { UserOperation } from "~packages/bundler"
import type { NetworkManager } from "~packages/network/manager"
import { type UserOperationAuthorizer } from "~packages/waallet/background/authorizer/userOperation"
import type { HexString } from "~typing"

import type { UserOperationPool } from "./index"

export class UserOperationSender implements UserOperationPool {
  private pool: { [userOpHash: HexString]: Promise<HexString> } = {}

  public constructor(
    private accountManager: AccountManager,
    private networkManager: NetworkManager,
    private userOperationAuthorizer: UserOperationAuthorizer
  ) {}

  public async send(data: {
    userOp: UserOperation
    senderId: string
    networkId: string
    entryPointAddress: HexString
  }): Promise<HexString> {
    const { userOp, senderId, networkId, entryPointAddress } = data
    const { bundler, chainId } = this.networkManager.get(networkId)
    const userOpAuthorized = await this.userOperationAuthorizer.authorize(
      userOp,
      {
        onApproved: async (userOpAuthorized, metadata) => {
          const { account } = await this.accountManager.get(senderId)
          userOpAuthorized.setSignature(
            await account.sign(
              userOpAuthorized.hash(entryPointAddress, chainId),
              metadata
            )
          )
          return userOpAuthorized
        }
      }
    )
    const userOpAuthorizedHash = await bundler.sendUserOperation(
      userOpAuthorized,
      entryPointAddress
    )
    if (!userOpAuthorizedHash) {
      throw new Error("Send user operation fail")
    }
    this.pool[userOpAuthorizedHash] = bundler.wait(userOpAuthorizedHash)

    return userOpAuthorizedHash
  }

  public wait(userOpHash: HexString): Promise<HexString> {
    return this.pool[userOpHash]
  }
}
