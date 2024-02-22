import { UserOperationData } from "~packages/provider/bundler"

export type UserOperationAuthorizeCallback = {
  onApproved: (
    userOpAuthorized: UserOperationData,
    metadata?: any
  ) => Promise<UserOperationData>
}

export interface UserOperationAuthorizer {
  authorize(
    userOp: UserOperationData,
    callback: UserOperationAuthorizeCallback
  ): Promise<UserOperationData>
}
