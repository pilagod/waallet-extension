import * as ethers from "ethers"

import type { AccountFactory } from "~packages/account/factory"
import type { ContractRunner } from "~packages/node"
import { Address, type AddressLike } from "~packages/primitive"
import type { BigNumberish } from "~typing"

import type { PasskeyPublicKey } from "./passkeyOwner"

export class PasskeyAccountFactory implements AccountFactory {
  public address: Address
  public salt: BigNumberish

  private factory: ethers.Contract
  private credentialId: string
  private publicKey: PasskeyPublicKey

  public constructor(
    private runner: ContractRunner,
    option: {
      address: AddressLike
      credentialId: string
      publicKey: PasskeyPublicKey
      salt: BigNumberish
    }
  ) {
    this.address = Address.wrap(option.address)
    this.factory = new ethers.Contract(
      this.address,
      [
        "function getAddress(string credId, uint256 pubKeyX, uint256 pubKeyY, uint256 salt) view returns (address)",
        "function createAccount(string credId, uint256 pubKeyX, uint256 pubKeyY, uint256 salt)",
        "function entryPoint() view returns (address)"
      ],
      this.runner
    )
    this.credentialId = option.credentialId
    this.publicKey = option.publicKey
    this.salt = option.salt
  }

  public async getAddress() {
    return Address.wrap(
      ethers.zeroPadValue(
        ethers.stripZerosLeft(
          // The name of
          // So we build call data from interface and directly send through node rpc provider.
          await this.runner.provider.call(
            await this.factory
              .getFunction("getAddress")
              .populateTransaction(
                this.credentialId,
                this.publicKey.x,
                this.publicKey.y,
                this.salt
              )
          )
        ),
        20
      )
    )
  }

  public async getEntryPoint() {
    return Address.wrap(await this.factory.entryPoint())
  }

  public async getInitCode() {
    const { data } = await this.factory
      .getFunction("createAccount")
      .populateTransaction(
        this.credentialId,
        this.publicKey.x,
        this.publicKey.y,
        this.salt
      )
    return ethers.concat([await this.factory.getAddress(), data])
  }
}
