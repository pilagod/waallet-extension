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
    return "0x0000000000000000000000009a9f2ccfde556a7e9ff0848998aa4a0cfd8863ae000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000040de97acc9056c02c78b8f4ca62e7ba661e5a4bdb4291363d2d5f1273ea43e0b4a25c6b3bea0b15149e5df149f019eaf0c2b3a39e124bda771a2f7f54ce0346169000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000005050000000200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000362c226f726967696e223a22687474703a2f2f6c6f63616c686f73743a35313733222c2263726f73734f726967696e223a66616c73657d00000000000000000000"
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
