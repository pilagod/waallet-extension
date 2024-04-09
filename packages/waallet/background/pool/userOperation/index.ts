import { UserOperation } from "~packages/bundler"
import type { HexString } from "~typing"

export type UserOperationReceipt = {
  userOpHash: HexString
  transactionHash: HexString
}

export interface UserOperationPool {
  /**
   * Send user operation to pool, it would be processed by bundler in some future.
   *
   * @return Uuid for this user operation
   */
  send(data: {
    userOp: UserOperation
    senderId: string
    networkId: string
    entryPointAddress: HexString
  }): Promise<string>
  /**
   * Wait for an user operation to be processed by bundler and finally included in a transaction on chain.
   *
   * @param userOpId: Uuid of the user operation
   *
   * @return The receipt of the user operation, including user operation hash and transaction hash.
   */
  wait(userOpId: string): Promise<UserOperationReceipt>
}
