import { getAddress } from "ethers"

import type { HexString } from "~typing"

export type AddressLike = Address | HexString

export class Address {
  public static wrap(address: AddressLike) {
    if (address instanceof Address) {
      return new Address(address.unwrap())
    }
    return new Address(getAddress(address))
  }

  private constructor(private address: HexString) {}

  public ellipsize() {
    return `${this.address.substring(0, 7)}...${this.address.substring(
      this.address.length - 5,
      this.address.length
    )}`
  }

  public isEqual(address: Address | HexString) {
    if (address instanceof Address) {
      return this.address === address.unwrap()
    }
    return this.address === getAddress(address)
  }

  public unwrap() {
    return this.address
  }
}
