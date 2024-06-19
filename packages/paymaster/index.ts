import { UserOperationV0_6 } from "~packages/bundler/userOperation"
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
   *
   * @param forGasEstimation Default to `false`.
   */
  requestPaymasterAndData(
    userOp: UserOperationV0_6,
    forGasEstimation?: boolean
  ): Promise<HexString>
}
