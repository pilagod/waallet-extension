import address from "~packages/util/address"
import number from "~packages/util/number"
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

export class Execution {
  public sender: HexString
  public nonce: bigint
  public callData: HexString
  public signature: HexString
  public factory?: HexString
  public factoryData?: HexString

  public constructor(data: {
    sender: HexString
    nonce: BigNumberish
    callData: HexString
    signature: HexString
    factory?: HexString
    factoryData?: HexString
  }) {
    this.sender = data.sender
    this.nonce = number.toBigInt(data.nonce)
    this.callData = data.callData
    this.signature = data.signature
    if (data.factory) {
      this.factory = address.normalize(data.factory)
    }
    if (data.factoryData) {
      this.factoryData = data.factoryData
    }
  }
}

export enum SignatureFormat {
  Raw = "Raw",
  Eip191 = "Eip191"
}

export interface Account {
  buildExecution(call: Call): Promise<Execution>
  getAddress(): Promise<HexString>
  getEntryPoint(): Promise<HexString>
  getNonce(): Promise<bigint>
  isDeployed(): Promise<boolean>
  sign(message: BytesLike, format?: SignatureFormat): Promise<HexString>
}
