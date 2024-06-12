import type { BigNumberish, BytesLike, HexString } from "~typing"

export enum AccountType {
  SimpleAccount = "SimpleAccount",
  PasskeyAccount = "PasskeyAccount"
}

export type Call = {
  to: HexString
  value: BigNumberish
  data: HexString
}

export type UserOperationCall = {
  sender: HexString
  nonce: bigint
  initCode: HexString
  callData: HexString
  /**
   * @dev Dummy signature for validation
   */
  signature: HexString
}

export interface Account {
  createUserOperationCall(call: Call): Promise<UserOperationCall>
  getAddress(): Promise<HexString>
  getEntryPoint(): Promise<HexString>
  getNonce(): Promise<bigint>
  isDeployed(): Promise<boolean>
  sign(message: BytesLike, metadata?: any): Promise<HexString>
}
