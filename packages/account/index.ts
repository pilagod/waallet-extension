import { UserOperation } from "~packages/bundler"
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

export interface Account {
  createUserOperation(call: Call): Promise<UserOperation>
  getAddress(): Promise<HexString>
  getEntryPoint(): Promise<HexString>
  getNonce(): Promise<bigint>
  isDeployed(): Promise<boolean>
  sign(message: BytesLike, metadata?: any): Promise<HexString>
}
