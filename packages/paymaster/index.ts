import type { UserOperation } from "~packages/provider/bundler"
import { Token } from "~packages/token"
import type { HexString } from "~typing"

export enum PaymasterType {
  Null,
  Verifying
}

export type PaymasterUserOperation = Partial<
  Omit<UserOperation, "paymasterAndData" | "signature">
>

export interface Paymaster {
  /**
   * Get tokens this paymaster accepted.
   */
  getAcceptedTokens(): Token[]
  /**
   * Quote the exchange rate from base token to native token in order to pay gas fee.
   */
  getExchangeRate(base: Token): number
  /**
   * Request `paymasterAndData` for user operation.
   */
  requestPaymasterAndData(userOp: PaymasterUserOperation): Promise<HexString>
}
