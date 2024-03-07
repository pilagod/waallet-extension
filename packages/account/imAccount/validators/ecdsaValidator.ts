import * as ethers from "ethers"

import ECDSAValidatorMetadata from "~packages/account/imAccount/abis/ECDSAValidator.json"
import type { Validator } from "~packages/account/imAccount/validator"
import type { HexString } from "~typing"

export class ECDSAValidator implements Validator {
  private node: ethers.JsonRpcProvider
  private owner: ethers.Wallet
  public contract: ethers.Contract

  public constructor(opts: {
    address: HexString
    ownerPrivateKey: string
    node: ethers.JsonRpcProvider
  }) {
    this.node = opts.node
    this.owner = new ethers.Wallet(opts.ownerPrivateKey)
    this.contract = new ethers.Contract(
      opts.address,
      ECDSAValidatorMetadata.abi,
      this.node
    )
  }

  public async sign(message: string | Uint8Array, metadata?: any) {
    if (message.length < 66) {
      message = ethers.encodeBytes32String(ethers.hexlify(message))
    }
    const digest = ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(
        ["bytes32", "address"],
        [message, await this.contract.getAddress()]
      )
    )
    const signingMsg = ethers.keccak256(
      ethers.solidityPacked(
        ["string", "string", "bytes"],
        ["\x19Ethereum Signed Message:\n32", digest.length, digest]
      )
    )
    const rawSignature = this.owner.signingKey.sign(signingMsg)
    const signature = ethers.AbiCoder.defaultAbiCoder().encode(
      ["address", "bytes"],
      [
        await this.contract.getAddress(),
        ethers.solidityPacked(
          ["bytes32", "bytes32", "uint8"],
          [rawSignature.r, rawSignature.s, rawSignature.v]
        )
      ]
    )
    return signature
  }

  public async setOwner(newOwnerPrivateKey: string) {
    this.owner = new ethers.Wallet(newOwnerPrivateKey)
    await this.contract.setOwner(this.owner.address)
  }

  public async getOwner(): Promise<HexString> {
    return await this.contract.getOwner()
  }

  public async isValidSignature(
    hash: string,
    signature: string
  ): Promise<boolean> {
    return await this.contract.isValidAccountSignature(hash, signature)
  }

  public async getAddress(): Promise<HexString> {
    return await this.contract.getAddress()
  }

  public async getOwnerValidatorInitData(
    ownerInfo: string
  ): Promise<HexString> {
    const { data } = await this.contract
      .getFunction("init")
      .populateTransaction(ownerInfo)
    return data
  }
}
