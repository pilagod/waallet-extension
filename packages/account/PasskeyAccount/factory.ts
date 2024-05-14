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

  public constructor(opts: {
    address: HexString
    credentialId: string
    publicKey: PasskeyPublicKey
    salt: BigNumberish
  }) {
    this.address = opts.address
    this.salt = opts.salt
    this.factory = new ethers.Contract(opts.address, [
      "function getAddress(string credId, uint256 pubKeyX, uint256 pubKeyY, uint256 salt) view returns (address)",
      "function createAccount(string credId, uint256 pubKeyX, uint256 pubKeyY, uint256 salt)"
    ])
    this.credentialId = opts.credentialId
    this.publicKey = opts.publicKey
  }

  public async getAddress(runner: ContractRunner) {
    return ethers.zeroPadValue(
      ethers.stripZerosLeft(
        // The name of `getAddress` conflicts with the function on ethers.Contract.
        // So we build call data from interface and directly send through node rpc provider.
        await runner.provider.call(
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
