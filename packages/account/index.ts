import type { BigNumberish, HexString } from "~typings"

export type UserOperationCall = {
  sender: HexString
  nonce: BigNumberish
  initCode: HexString
  callData: HexString
  signature: HexString // Dummy signature for simulation
}

export type TransactionCall = {
  to: HexString
  value: BigNumberish
  data: HexString
  nonce?: BigNumberish
}

export interface Account {
  createUserOperationCall(tx: TransactionCall): Promise<UserOperationCall>
  getAddress(): Promise<HexString>
  isDeployed(): Promise<boolean>
  signMessage(message: string | Uint8Array): Promise<HexString>
}
