import { Address, type AddressLike } from "~packages/primitive"
import number from "~packages/util/number"
import type { BigNumberish, BytesLike, HexString } from "~typing"

export enum AccountType {
  SimpleAccount = "SimpleAccount",
  PasskeyAccount = "PasskeyAccount"
}

export type Call = {
  to: AddressLike
  value: BigNumberish
  data: HexString
}

export class Execution {
  public sender: Address
  public nonce: bigint
  public callData: HexString
  public signature: HexString
  public factory?: Address
  public factoryData?: HexString

  public constructor(data: {
    sender: AddressLike
    nonce: BigNumberish
    callData: HexString
    signature: HexString
    factory?: AddressLike
    factoryData?: HexString
  }) {
    this.sender = Address.wrap(data.sender)
    this.nonce = number.toBigInt(data.nonce)
    this.callData = data.callData
    this.signature = data.signature
    if (data.factory) {
      this.factory = Address.wrap(data.factory)
    }
    if (data.factoryData) {
      this.factoryData = data.factoryData
    }
  }
}

export interface Account {
  buildExecution(call: Call): Promise<Execution>
  getAddress(): Address
  getBalance(): Promise<bigint>
  getEntryPoint(): Promise<Address>
  getNonce(): Promise<bigint>
  isDeployed(): Promise<boolean>
  sign(message: BytesLike, metadata?: any): Promise<HexString>
}
