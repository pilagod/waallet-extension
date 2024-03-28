import { type Account } from "~packages/account"
import { UserOperation } from "~packages/bundler"
import { BundlerProvider } from "~packages/bundler/provider"
import { type UserOperationAuthorizer } from "~packages/waallet/background/authorizer/userOperation"
import type { BigNumberish, HexString } from "~typing"

import type { UserOperationPool } from "./index"

export class UserOperationSender implements UserOperationPool {
  private pool: { [userOpHash: HexString]: Promise<HexString> } = {}

  public constructor(
    private bundler: BundlerProvider,
    private userOperationAuthorizer: UserOperationAuthorizer
  ) {}

  public async send(data: {
    userOp: UserOperation
    sender: Account
    chainId: BigNumberish
    entryPointAddress: HexString
  }): Promise<HexString> {
    const { userOp, sender, chainId, entryPointAddress } = data
    const userOpAuthorized = await this.userOperationAuthorizer.authorize(
      userOp,
      {
        onApproved: async (userOpAuthorized, metadata) => {
          userOpAuthorized.setSignature(
            await sender.sign(
              userOpAuthorized.hash(entryPointAddress, chainId),
              metadata
            )
          )
          return userOpAuthorized
        }
      }
    )
    const userOpAuthorizedHash = await this.bundler.sendUserOperation(
      userOpAuthorized,
      entryPointAddress
    )
    if (!userOpAuthorizedHash) {
      throw new Error("Send user operation fail")
    }
    this.pool[userOpAuthorizedHash] = this.bundler.wait(userOpAuthorizedHash)

    return userOpAuthorizedHash
  }

  public wait(userOpHash: HexString): Promise<HexString> {
    return this.pool[userOpHash]
  }
}
