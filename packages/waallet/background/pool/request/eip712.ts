import { TypedDataEncoder } from "ethers"

import type { Eip712Domain, Eip712Types } from "~packages/waallet/rpc"

export class Eip712Request {
  public types: Eip712Types
  public domain: Eip712Domain
  public primaryType: string
  public message: Record<string, any>

  public constructor(data: {
    types: Eip712Types
    domain: Eip712Domain
    primaryType: string
    message: Record<string, any>
  }) {
    this.types = data.types
    this.domain = data.domain
    this.primaryType = data.primaryType
    this.message = data.message
  }

  public hash() {
    return TypedDataEncoder.hash(this.domain, this.types, this.message)
  }
}
