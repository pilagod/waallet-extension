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
  createUserOperationCall(call: Call): Promise<UserOperationCall>
  getAddress(): Promise<HexString>
  isDeployed(): Promise<boolean>
  sign(message: BytesLike): Promise<HexString>
}
