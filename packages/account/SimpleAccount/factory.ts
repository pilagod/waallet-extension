import * as ethers from "ethers"

import type { AccountFactory } from "~packages/account/factory"
import type { ContractRunner } from "~packages/node"
import { Address, type AddressLike } from "~packages/primitive"
import number from "~packages/util/number"
import type { BigNumberish } from "~typing"

export class SimpleAccountFactory implements AccountFactory {
  public address: Address
  public salt: bigint

  private factory: ethers.Contract
  private owner: Address

  public constructor(
    private runner: ContractRunner,
    option: {
      address: AddressLike
      owner: AddressLike
      salt: BigNumberish
    }
  ) {
    this.address = Address.wrap(option.address)
    this.owner = Address.wrap(option.owner)
    this.salt = number.toBigInt(option.salt)
    this.factory = new ethers.Contract(
      this.address,
      [
        "function getAddress(address owner, uint256 salt) view returns (address)",
        "function createAccount(address owner,uint256 salt)",
        "function accountImplementation() view returns (address)"
      ],
      this.runner
    )
  }

  public async getAddress() {
    return Address.wrap(
      ethers.zeroPadValue(
        ethers.stripZerosLeft(
          // The name of `getAddress` conflicts with the function on ethers.Contract.
          // So we build call data from interface and directly send through node rpc provider.
          await this.runner.provider.call(
            await this.factory
              .getFunction("getAddress")
              .populateTransaction(this.owner, this.salt)
          )
        ),
        20
      )
    )
  }

  public async getEntryPoint() {
    const accountImpl = new ethers.Contract(
      await this.factory.accountImplementation(),
      ["function entryPoint() view returns (address)"],
      this.runner
    )
    return Address.wrap(await accountImpl.entryPoint())
  }

  public async getInitCode() {
    const { data } = await this.factory
      .getFunction("createAccount")
      .populateTransaction(this.owner, this.salt)
    return ethers.concat([await this.factory.getAddress(), data])
  }
}
