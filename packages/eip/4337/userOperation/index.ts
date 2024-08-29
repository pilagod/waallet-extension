import { UserOperationV0_6, type UserOperationDataV0_6 } from "./v0_6"
import { UserOperationV0_7, type UserOperationDataV0_7 } from "./v0_7"

export * from "./v0_6"
export * from "./v0_7"

export type UserOperation = UserOperationV0_6 | UserOperationV0_7
export type UserOperationData = UserOperationDataV0_6 | UserOperationDataV0_7
