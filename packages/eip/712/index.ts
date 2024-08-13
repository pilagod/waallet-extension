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
