import * as ethers from "ethers"

import type { AccountFactory } from "~packages/account/factory"
import type { ContractRunner } from "~packages/node"
import type { BigNumberish, HexString } from "~typing"

import type { PasskeyPublicKey } from "./passkeyOwner"

export class PasskeyAccountFactory implements AccountFactory {
  public address: HexString
  public salt: BigNumberish

  private factory: ethers.Contract
  private credentialId: string
  private publicKey: PasskeyPublicKey

  public constructor(
    private runner: ContractRunner,
    option: {
      address: HexString
      credentialId: string
      publicKey: PasskeyPublicKey
      salt: BigNumberish
    }
  ) {
    this.address = option.address
    this.salt = option.salt
    this.factory = new ethers.Contract(
      option.address,
      [
        "function getAddress(string credId, uint256 pubKeyX, uint256 pubKeyY, uint256 salt) view returns (address)",
        "function createAccount(string credId, uint256 pubKeyX, uint256 pubKeyY, uint256 salt)",
        "function entryPoint() view returns (address)"
      ],
      this.runner
    )
    this.credentialId = option.credentialId
    this.publicKey = option.publicKey
  }

  public async getAddress() {
    return ethers.zeroPadValue(
      ethers.stripZerosLeft(
        // The name of `getAddress` conflicts with the function on ethers.Contract.
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
  }

  public async getEntryPoint() {
    return this.factory.entryPoint()
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
