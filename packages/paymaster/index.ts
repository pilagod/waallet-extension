import type { UserOperation } from "~packages/provider/bundler/typing"
import type { HexString } from "~typing"

export interface Paymaster {
  requestPayment(userOp: Partial<UserOperation>): Promise<HexString>
}
