import { UserOperation } from "~packages/bundler"
import type { BigNumberish, BytesLike, HexString } from "~typing"

export type UserOperationCall = {
  sender: HexString
  nonce: BigNumberish
  initCode: HexString
  callData: HexString
  signature: HexString // Dummy signature for simulation
}

export type Call = {
  to: HexString
  value: BigNumberish
  data: HexString
  nonce?: BigNumberish
}

export interface Account {
  createUserOperation(call: Call): Promise<UserOperation>
  getAddress(): Promise<HexString>
  isDeployed(): Promise<boolean>
  sign(message: BytesLike, metadata?: any): Promise<HexString>
}
