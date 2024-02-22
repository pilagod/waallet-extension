import { UserOperationData } from "~packages/provider/bundler"

import {
  type UserOperationAuthorizeCallback,
  type UserOperationAuthorizer
} from "./index"

export class NullUserOperationAuthorizer implements UserOperationAuthorizer {
  public authorize(
    userOp: UserOperationData,
    { onApproved }: UserOperationAuthorizeCallback
  ) {
    return onApproved(userOp)
  }
}
