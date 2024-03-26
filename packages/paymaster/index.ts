import { UserOperation } from "~packages/bundler"
import type { ContractRunner } from "~packages/node"
import { Token } from "~packages/token"
import type { HexString } from "~typing"

export enum PaymasterType {
  Null,
  Verifying
}

export interface Paymaster {
  /**
   * Quote fee in `quote` token
   */
  quoteFee(fee: bigint, quote: Token): Promise<bigint>
  /**
   * Request `paymasterAndData` for user operation.
   */
  requestPaymasterAndData(
    runner: ContractRunner,
    userOp: UserOperation
  ): Promise<HexString>
}
