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

export type ExchangeRate = {
  rate: bigint
  decimals: number
}

export interface Paymaster {
  /**
   * Quote the exchange rate of quote token to native token in order to pay gas fee.
   */
  getExchangeRate(quote: Token): Promise<ExchangeRate>
  /**
   * Request `paymasterAndData` for user operation.
   */
  requestPaymasterAndData(userOp: PaymasterUserOperation): Promise<HexString>
}
