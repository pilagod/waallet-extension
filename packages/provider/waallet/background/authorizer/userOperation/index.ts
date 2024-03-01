import { UserOperation } from "~packages/provider/bundler"

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
