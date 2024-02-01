import type { UserOperation } from "~packages/provider/bundler/typing"

export type UserOperationAuthorizeCallback = {
  onApproved: (
    userOpAuthorized: UserOperation,
    metadata?: any
  ) => Promise<UserOperation>
}

export interface UserOperationAuthorizer {
  authorize(
    userOp: UserOperation,
    callback: UserOperationAuthorizeCallback
  ): Promise<UserOperation>
}
