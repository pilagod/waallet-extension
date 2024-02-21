import type { UserOperation } from "~packages/provider/bundler"
import type { HexString } from "~typing"

export enum PaymasterType {
  Null,
  Verifying
}

export type PaymasterUserOperation = Partial<
  Omit<UserOperation, "paymasterAndData" | "signature">
>

export interface Paymaster {
  requestPaymasterAndData(userOp: PaymasterUserOperation): Promise<HexString>
}
