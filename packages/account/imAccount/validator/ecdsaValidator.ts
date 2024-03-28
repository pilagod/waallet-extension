import * as ethers from "ethers"

import ECDSAValidatorMetadata from "~packages/account/imAccount/abi/ECDSAValidator.json"
import type { Validator } from "~packages/account/imAccount/validator"
import { connect, type ContractRunner } from "~packages/node"
import type { BytesLike, HexString } from "~typing"

import { getValidatorSignMessage } from "../validator"

export class ECDSAValidator implements Validator {
  private owner: ethers.Wallet
  public contract: ethers.Contract

  public constructor(opts: { address: HexString; ownerPrivateKey: string }) {
    this.owner = new ethers.Wallet(opts.ownerPrivateKey)
    this.contract = new ethers.Contract(
      opts.address,
      ECDSAValidatorMetadata.abi
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

    const signingMsg = getValidatorSignMessage(
      message,
      await this.contract.getAddress()
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

  public async getOwner(
    runner: ContractRunner,
    account: string
  ): Promise<HexString> {
    return await connect(this.contract, runner).getOwner(account)
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
