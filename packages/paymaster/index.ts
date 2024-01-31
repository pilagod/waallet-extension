import type { UserOperation } from "~packages/provider/bundler/typing"
import type { HexString } from "~typing"

export type RequestPaymentOption = {
  isGasEstimation: boolean
}

export interface Paymaster {
  requestPayment(
    userOp: Partial<UserOperation>,
    option?: RequestPaymentOption
  ): Promise<HexString>
}
