import { UserOperation } from "~packages/bundler"
import type { NetworkContext } from "~packages/context/network"
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
    ctx: NetworkContext,
    userOp: UserOperation
  ): Promise<HexString>
}
