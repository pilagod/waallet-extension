import { getAddress, isAddress } from "ethers"

import type { HexString } from "~typing"

interface NodeProvider {
  getBalance(address: HexString): Promise<bigint>
  getCode(address: HexString): Promise<HexString>
}

export type AddressLike = Address | HexString

export class Address {
  public static isValid(address: string) {
    return isAddress(address)
  }

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

  /**
   * @dev Implement `ethers.Addressable` interface
   */
  public async getAddress(): Promise<string> {
    return this.unwrap()
  }

  public async isContract(node: NodeProvider) {
    const code = await node.getCode(this.unwrap())
    return code !== "0x"
  }

  public isEqual(address: AddressLike) {
    if (address instanceof Address) {
      return this.address === address.unwrap()
    }
    return this.address === getAddress(address)
  }

  public toString() {
    return this.unwrap()
  }

  public unwrap() {
    return this.address
  }
}
