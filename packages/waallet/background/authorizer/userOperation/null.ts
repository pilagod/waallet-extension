import { UserOperation } from "~packages/bundler"

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
