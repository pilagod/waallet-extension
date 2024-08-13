import { TypedDataEncoder } from "ethers"

import type { BigNumberish, BytesLike, HexString, Nullable } from "~typing"

export type Eip712TypedData = {
  /**
   * Define data structs for `domain` and `message`.
   */
  types: Eip712Types

  /**
   *  https://eips.ethereum.org/EIPS/eip-712#definition-of-domainseparator
   */
  domain: Eip712Domain

  /**
   * Name of a type in `types` that describes the struct of `message`.
   */
  primaryType: string

  /**
   * Data for the struct of `primaryType`.
   */
  message: Record<string, any>
}

export type Eip712Domain = {
  name?: Nullable<string>
  version?: Nullable<string>
  chainId?: Nullable<BigNumberish>
  verifyingContract?: Nullable<HexString>
  salt?: Nullable<BytesLike>
}

export type Eip712Types = Record<string, Eip712Type[]>

export type Eip712Type = {
  name: string
  type: string
}

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
    // TypedDataEncoder forbids unused type in message
    const { EIP712Domain, ...types } = this.types
    return TypedDataEncoder.hash(this.domain, types, this.message)
  }

  public unwrap(): Eip712TypedData {
    return {
      types: this.types,
      domain: this.domain,
      primaryType: this.primaryType,
      message: this.message
    }
  }
}
