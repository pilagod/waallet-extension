import type { UserOperation } from "~packages/provider/bundler/typing"

import {
  type UserOperationAuthorizeCallback,
  type UserOperationAuthorizer
} from "./index"

export class NullUserOperationAuthorizer implements UserOperationAuthorizer {
  public authorize(
    userOp: UserOperation,
    { onApproved }: UserOperationAuthorizeCallback
  ) {
    return onApproved(userOp)
  }
}
