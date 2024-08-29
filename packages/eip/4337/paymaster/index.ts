import { type UserOperation } from "~packages/eip/4337/userOperation"
import { type Token } from "~packages/token"
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
   *
   * @param forGasEstimation Default to `false`.
   */
  requestPaymasterAndData(
    userOp: UserOperation,
    forGasEstimation?: boolean
  ): Promise<HexString>
}
