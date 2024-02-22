import { UserOperation } from "~packages/provider/bundler"
import type { HexString } from "~typing"

export enum PaymasterType {
  Null,
  Verifying
}

export interface Paymaster {
  requestPaymasterAndData(userOp: UserOperation): Promise<HexString>
}
