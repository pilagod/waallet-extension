import { UserOperation } from "~packages/bundler"
import type { NetworkContext } from "~packages/context/network"
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
  createUserOperation(ctx: NetworkContext, call: Call): Promise<UserOperation>
  getAddress(): Promise<HexString>
  isDeployed(ctx: NetworkContext): Promise<boolean>
  sign(message: BytesLike, metadata?: any): Promise<HexString>
}
