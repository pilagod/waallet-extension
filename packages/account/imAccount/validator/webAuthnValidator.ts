import * as ethers from "ethers"

import WebAuthnValidatorMetadata from "~packages/account/imAccount/abi/WebAuthnValidator.json"
import type { Validator } from "~packages/account/imAccount/validator"
import type { BytesLike, HexString } from "~typing"

import type { PasskeyOwner } from "../../PasskeyAccount/passkeyOwner"

export type WebAuthnInput = {
  authenticatorFlagsAndSignCount: BytesLike
  postChallengeData: HexString
}

export type WebAuthnInfo = {
  authenticatorData: BytesLike
  clientDataJSON: HexString
}

export class WebAuthnValidator implements Validator {
  private node: ethers.JsonRpcProvider
  private owner: PasskeyOwner
  public x: bigint
  public y: bigint
  public contract: ethers.Contract

  public DEFAULT_AUTHENTICATOR_RPID_HASH =
    "0x49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d9763"
  public DEFAULT_AUTHENTICATOR_FLAGS = "0x05"
  public DEFAULT_AUTHENTICATOR_SIGN_COUNT = "0x00000002"

  public constructor(opts: {
    address: HexString
    owner: PasskeyOwner
    x: bigint
    y: bigint
    credentialId: string
    nodeRpcUrl: string
  }) {
    this.node = new ethers.JsonRpcProvider(opts.nodeRpcUrl)
    this.owner = opts.owner
    this.owner.use(opts.credentialId)
    this.x = opts.x
    this.y = opts.y
    this.contract = new ethers.Contract(
      opts.address,
      WebAuthnValidatorMetadata.abi,
      this.node
    )
  }

  public async getDummySignature(): Promise<HexString> {
    return await this.sign("DummyMessage")

    // TODO: give a static dummy signature
    // return ethers.AbiCoder.defaultAbiCoder().encode(
    //   ["address", "bytes"],
    //   [
    //     await this.contract.getAddress(),
    //     "0x00000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000001600000000000000000000000000000000000000000000000000000000000000017000000000000000000000000000000000000000000000000000000000000000150e9e8c7d5a5cfa26f5edf2d5643190c9978c72737bd2cf40d5cd053ac00d57501a5dad3af5fe8af6fe0b5868fc95d31ad760f3b6f2be52fb66aee4a92405ae000000000000000000000000000000000000000000000000000000000000000254fb20856f24a6ae7dafc2781090ac8477ae6e2bd072660236cc614c6fb7c2ea0050000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000667b2274797065223a22776562617574686e2e676574222c226368616c6c656e6765223a22222c226f726967696e223a2268747470733a2f2f776562617574686e2e70617373776f72646c6573732e6964222c2263726f73734f726967696e223a66616c73657d0000000000000000000000000000000000000000000000000000"
    //   ]
    // )
  }

  // Message is userOpHash
  public async sign(message: BytesLike): Promise<HexString> {
    if (typeof message == "string" && !ethers.isHexString(message)) {
      message = ethers.encodeBytes32String(message)
    }

    const [webAuthnHash, webAuthnInput] = await this.getWebAuthnInput(message)

    const rawSignature = await this.owner.sign(webAuthnHash.replace(/^0x/, ""))
    const signature = ethers.AbiCoder.defaultAbiCoder().encode(
      [
        "address",
        "bytes",
        "(bytes authenticatorFlagsAndSignCount,string postChallengeData)"
      ],
      [await this.contract.getAddress(), rawSignature, webAuthnInput]
    )
    return signature
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

  public async getWebAuthnInfoHash(
    webAuthnInfo: WebAuthnInfo
  ): Promise<HexString> {
    return await this.contract.getWebAuthnInfoHash(webAuthnInfo)
  }

  public async getAuthenticatorRPIDHash(account: string): Promise<HexString> {
    return await this.contract.getAuthenticatorRPIDHash(account)
  }

  public async getOwner(account: string): Promise<bigint[]> {
    return await this.contract.getOwner(account)
  }

  public async getAddress(): Promise<HexString> {
    return await this.contract.getAddress()
  }

  public async getBase64SignedChallenge(hash: BytesLike): Promise<string> {
    return await this.contract.getBase64SignedChallenge(hash)
  }

  public async getOwnerValidatorInitData(): Promise<HexString> {
    const { data } = await this.contract
      .getFunction("init")
      .populateTransaction(this.x, this.y, this.DEFAULT_AUTHENTICATOR_RPID_HASH)
    return data
  }

  public async getWebAuthnInput(
    hash: BytesLike
  ): Promise<[HexString, WebAuthnInput]> {
    const challengeBaseUrl = await this.getBase64SignedChallenge(hash)
    const PRE_CHALLENGE_DATA = `{"type":"webauthn.get",`
    const postChallengeData = `,"origin":"http://localhost:5173","crossOrigin":false}`
    const clientDataJson =
      PRE_CHALLENGE_DATA +
      `"challenge":"` +
      challengeBaseUrl +
      `"` +
      postChallengeData
    const authenticatorData = this.getAuthenticatorData()
    const webAuthnInfo = {
      authenticatorData: authenticatorData,
      clientDataJSON: clientDataJson
    }
    const webAuthnHash = await this.getWebAuthnInfoHash(webAuthnInfo)
    const webAuthnInput = {
      authenticatorFlagsAndSignCount: ethers.concat([
        this.DEFAULT_AUTHENTICATOR_FLAGS,
        this.DEFAULT_AUTHENTICATOR_SIGN_COUNT
      ]),
      postChallengeData: postChallengeData
    }
    return [webAuthnHash, webAuthnInput]
  }

  public getAuthenticatorData() {
    return ethers.concat([
      this.DEFAULT_AUTHENTICATOR_RPID_HASH,
      this.DEFAULT_AUTHENTICATOR_FLAGS,
      this.DEFAULT_AUTHENTICATOR_SIGN_COUNT
    ])
  }
}
