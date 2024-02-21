import type { UserOperation } from "~packages/provider/bundler"
import type { HexString } from "~typing"

export enum PaymasterType {
  Null,
  Verifying
}

export type PaymasterUserOperation = Partial<
  Omit<UserOperation, "paymasterAndData" | "signature">
>

export type PaymasterRequestOption = {
  isGasEstimation: boolean
}

export interface Paymaster {
  requestPaymasterAndData(
    userOp: PaymasterUserOperation,
    option?: PaymasterRequestOption
  ): Promise<HexString>
}
