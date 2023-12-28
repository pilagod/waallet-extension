import * as ethers from "ethers"

import type { BigNumberish, HexString } from "~typing"

export type PasskeyPublicKey = {
  x: BigNumberish
  y: BigNumberish
}

export class PasskeyAccountFactory {
  private node: ethers.JsonRpcProvider

  private factory: ethers.Contract
  private credentialId: string
  private publicKey: PasskeyPublicKey
  private salt: BigNumberish

  public constructor(opts: {
    address: HexString
    credentialId: string
    publicKey: PasskeyPublicKey
    salt: BigNumberish
    nodeRpcUrl: string
  }) {
    this.node = new ethers.JsonRpcProvider(opts.nodeRpcUrl)
    this.factory = new ethers.Contract(
      opts.address,
      [
        "function getAddress(string credId, uint256 pubKeyX, uint256 pubKeyY, uint256 salt) view returns (address)",
        "function createAccount(string credId, uint256 pubKeyX, uint256 pubKeyY, uint256 salt)"
      ],
      this.node
    )
    this.credentialId = opts.credentialId
    this.publicKey = opts.publicKey
    this.salt = opts.salt
  }

  public async getAddress() {
    return ethers.zeroPadValue(
      ethers.stripZerosLeft(
        // The name of `getAddress` conflicts with the function on ethers.Contract.
        // So we build call data from interface and directly send through node rpc provider.
        await this.node.call(
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
