import type { BigNumberish, HexString } from "~typing"

export type UserOperation = {
  sender: HexString
  nonce: BigNumberish
  initCode: HexString
  callData: HexString
  callGasLimit: BigNumberish
  verificationGasLimit: BigNumberish
  preVerificationGas: BigNumberish
  maxFeePerGas: BigNumberish
  maxPriorityFeePerGas: BigNumberish
  paymasterAndData: HexString
  signature: HexString
}
