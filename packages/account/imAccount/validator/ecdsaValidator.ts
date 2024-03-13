import * as ethers from "ethers"

import ECDSAValidatorMetadata from "~packages/account/imAccount/abi/ECDSAValidator.json"
import type { Validator } from "~packages/account/imAccount/validator"
import type { BytesLike, HexString } from "~typing"

export class ECDSAValidator implements Validator {
  private node: ethers.JsonRpcProvider
  private owner: ethers.Wallet
  public contract: ethers.Contract

  public constructor(opts: {
    address: HexString
    ownerPrivateKey: string
    nodeRpcUrl: string
  }) {
    this.node = new ethers.JsonRpcProvider(opts.nodeRpcUrl)
    this.owner = new ethers.Wallet(opts.ownerPrivateKey)
    this.contract = new ethers.Contract(
      opts.address,
      ECDSAValidatorMetadata.abi,
      this.node
    )
  }

  public async getDummySignature(): Promise<HexString> {
    return ethers.AbiCoder.defaultAbiCoder().encode(
      ["address", "bytes"],
      [
        await this.contract.getAddress(),
        "0xfffffffffffffffffffffffffffffff0000000000000000000000000000000007aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1c"
      ]
    )
  }

  public async sign(message: BytesLike): Promise<HexString> {
    if (typeof message == "string" && !ethers.isHexString(message)) {
      message = ethers.encodeBytes32String(message)
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
        [
          "\x19Ethereum Signed Message:\n",
          ethers.dataLength(digest).toString(), // digest length must be 32
          digest
        ]
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

  public getSetOwnerCallData(newOwnerAddress: string) {
    return this.contract.interface.encodeFunctionData("setOwner", [
      newOwnerAddress
    ])
  }

  public async getOwner(account: string): Promise<HexString> {
    return await this.contract.getOwner(account)
  }

  public async getAddress(): Promise<HexString> {
    return await this.contract.getAddress()
  }

  public async getOwnerValidatorInitData(): Promise<HexString> {
    const { data } = await this.contract
      .getFunction("init")
      .populateTransaction(this.owner.address)
    return data
  }
}
