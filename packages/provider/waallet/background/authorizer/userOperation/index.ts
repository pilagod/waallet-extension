import { PaymasterType } from "~packages/paymaster"
import type { UserOperation } from "~packages/provider/bundler/typing"

export type Payment = {
  paymasterType: PaymasterType.Null
}

export type UserOperationAuthorizeCallback = {
  onApproved: (
    userOpAuthorized: UserOperation,
    payment: Payment,
    metadata?: any
  ) => Promise<UserOperation>
}

export interface UserOperationAuthorizer {
  authorize(
    userOp: UserOperation,
    callback: UserOperationAuthorizeCallback
  ): Promise<UserOperation>
}
