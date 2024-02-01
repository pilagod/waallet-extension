import type { UserOperation } from "~packages/provider/bundler/typing"
import type { HexString } from "~typing"

export enum PaymasterType {
  Null
}

export type Payment = {
  paymasterType: PaymasterType.Null
}

export interface Paymaster {
  requestPaymasterAndData(userOp: Partial<UserOperation>): Promise<HexString>
}
