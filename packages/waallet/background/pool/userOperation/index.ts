import { type Account } from "~packages/account"
import { UserOperation } from "~packages/bundler"
import type { HexString } from "~typing"

export interface UserOperationPool {
  /**
   * Send user operation to pool, it would be processed by bundler in some future.
   *
   * @return The hash of the user operation
   */
  send(data: {
    userOp: UserOperation
    sender: Account
    networkId: string
    entryPointAddress: HexString
  }): Promise<HexString>
  /**
   * Wait for an user operation to be processed by bundler and finally included in a transaction on chain.
   *
   * @return The transaction hash including this user operation
   */
  wait(userOpHash: HexString): Promise<HexString>
}
