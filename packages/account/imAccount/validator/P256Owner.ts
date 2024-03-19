import { p256 } from "@noble/curves/p256"
import * as ethers from "ethers"

import byte from "~packages/util/byte"
import type { BytesLike } from "~typing"

import type { WebAuthnValidatorOwner } from "../validator"

export class P256Owner implements WebAuthnValidatorOwner {
  public credentialId: string
  public privateKey: Uint8Array
  public publicKey: Uint8Array
  public x: bigint
  public y: bigint

  public DEFAULT_AUTHENTICATOR_RPID_HASH =
    "0x49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d9763"
  public DEFAULT_AUTHENTICATOR_FLAGS = "0x05"
  public DEFAULT_AUTHENTICATOR_SIGN_COUNT = "0x00000002"

  public constructor() {
    this.privateKey = p256.utils.randomPrivateKey()
    this.publicKey = p256.getPublicKey(this.privateKey)

    const point = p256.ProjectivePoint.fromPrivateKey(this.privateKey)
    this.x = point.x
    this.y = point.y
  }

  public use(credentialId: string) {
    this.credentialId = credentialId
  }

  public async sign(challenge: BytesLike) {
    if (!this.credentialId) {
      throw new Error("Credential id is not set")
    }
    const challengeBaseUrl = byte.normalize(challenge).toString("base64url")
    const preChallengeData = `{"type":"webauthn.get",`
    const postChallengeData = `,"origin":"http://localhost:5173","crossOrigin":false}`
    const clientDataJson =
      preChallengeData +
      `"challenge":"` +
      challengeBaseUrl +
      `"` +
      postChallengeData
    const authenticatorData = this.getAuthenticatorData()

    const webAuthnHash = this.getWebAuthnHash(authenticatorData, clientDataJson)
    let { r, s } = p256.sign(webAuthnHash.replace(/^0x/, ""), this.privateKey)
    if (s > p256.CURVE.n / 2n) {
      s = p256.CURVE.n - s
    }
    const signature = ethers.AbiCoder.defaultAbiCoder().encode(
      ["uint256", "uint256"],
      [r, s]
    )

    const webAuthnInput = {
      authenticatorFlagsAndSignCount: ethers.concat([
        this.DEFAULT_AUTHENTICATOR_FLAGS,
        this.DEFAULT_AUTHENTICATOR_SIGN_COUNT
      ]),
      postChallengeData: postChallengeData
    }
    return {
      rawSignature: signature,
      webAuthnInput: webAuthnInput
    }
  }

  public getWebAuthnHash(authenticatorData: string, clientDataJson: string) {
    return byte
      .sha256(
        `${authenticatorData}${byte.sha256(clientDataJson).toString("hex")}`
      )
      .toString("hex")
  }

  public getAuthenticatorData() {
    return ethers.concat([
      this.DEFAULT_AUTHENTICATOR_RPID_HASH,
      this.DEFAULT_AUTHENTICATOR_FLAGS,
      this.DEFAULT_AUTHENTICATOR_SIGN_COUNT
    ])
  }
}
