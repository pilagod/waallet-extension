import * as ethers from "ethers"

import WebAuthnValidatorMetadata from "~packages/account/imAccount/abi/WebAuthnValidator.json"
import type { Validator } from "~packages/account/imAccount/validator"
import { connect, type ContractRunner } from "~packages/node"
import type { BytesLike, HexString } from "~typing"

import { getValidatorSignMessage } from "../validator"
import type { WebAuthnValidatorOwner } from "../validator"

export type WebAuthnInput = {
  authenticatorFlagsAndSignCount: BytesLike
  postChallengeData: HexString
}

export type WebAuthnInfo = {
  authenticatorData: BytesLike
  clientDataJSON: HexString
}

export class WebAuthnValidator implements Validator {
  private owner: WebAuthnValidatorOwner
  public x: bigint
  public y: bigint
  public authenticatorRpidHash: string
  public contract: ethers.Contract

  public constructor(opts: {
    address: HexString
    owner: WebAuthnValidatorOwner
    x: bigint
    y: bigint
    authenticatorRpidHash: string
    credentialId: string
  }) {
    this.owner = opts.owner
    this.owner.use(opts.credentialId)
    this.x = opts.x
    this.y = opts.y
    this.authenticatorRpidHash = opts.authenticatorRpidHash
    this.contract = new ethers.Contract(
      opts.address,
      WebAuthnValidatorMetadata.abi
    )
  }

  public async getDummySignature(): Promise<HexString> {
    return "0x0000000000000000000000009a9f2ccfde556a7e9ff0848998aa4a0cfd8863ae000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000040de97acc9056c02c78b8f4ca62e7ba661e5a4bdb4291363d2d5f1273ea43e0b4a25c6b3bea0b15149e5df149f019eaf0c2b3a39e124bda771a2f7f54ce0346169000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000005050000000200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000362c226f726967696e223a22687474703a2f2f6c6f63616c686f73743a35313733222c2263726f73734f726967696e223a66616c73657d00000000000000000000"
  }

  public async sign(message: BytesLike): Promise<HexString> {
    const validatorAddress = await this.contract.getAddress()
    if (typeof message == "string" && !ethers.isHexString(message)) {
      message = ethers.encodeBytes32String(message)
    }

    const signingMsg = getValidatorSignMessage(message, validatorAddress)
    const { signature, clientData, authenticatorData } =
      await this.owner.sign(signingMsg)

    const encodedSignature = ethers.AbiCoder.defaultAbiCoder().encode(
      ["uint256", "uint256"],
      [signature.r, signature.s]
    )

    const webAuthnInput = {
      authenticatorFlagsAndSignCount: ethers.concat([
        ethers.zeroPadValue(
          ethers.toBeHex(authenticatorData.flags.flagsInt),
          1
        ),
        ethers.zeroPadValue(ethers.toBeHex(authenticatorData.counter), 4)
      ]),
      postChallengeData: `,"origin":"${clientData.origin}","crossOrigin":${clientData.crossOrigin}}`
    }

    return ethers.AbiCoder.defaultAbiCoder().encode(
      [
        "address",
        "bytes",
        "(bytes authenticatorFlagsAndSignCount,string postChallengeData)"
      ],
      [validatorAddress, encodedSignature, webAuthnInput]
    )
  }

  public getSetOwnerAndAuthenticatorRPIDHashCallData(
    ownerX: bigint,
    ownerY: bigint,
    authenticatorRPIDHash: BytesLike
  ) {
    return this.contract.interface.encodeFunctionData(
      "setOwnerAndAuthenticatorRPIDHash",
      [ownerX, ownerY, authenticatorRPIDHash]
    )
  }

  public async getOwner(
    runner: ContractRunner,
    account: string
  ): Promise<bigint[]> {
    const contract = new ethers.Contract(
      await this.getAddress(),
      [
        "function getOwner(address account) view returns (uint256 ownerX, uint256 ownerY)"
      ],
      runner
    )
    const { ownerX, ownerY } = await contract.getOwner(account)
    return [ownerX, ownerY]
  }

  public async getAddress(): Promise<HexString> {
    return await this.contract.getAddress()
  }

  public async getBase64SignedChallenge(
    runner: ContractRunner,
    hash: BytesLike
  ): Promise<string> {
    return await connect(this.contract, runner).getBase64SignedChallenge(hash)
  }

  public async getOwnerValidatorInitData(): Promise<HexString> {
    const { data } = await this.contract
      .getFunction("init")
      .populateTransaction(this.x, this.y, this.authenticatorRpidHash)
    return data
  }
}
