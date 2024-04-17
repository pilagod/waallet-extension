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

  public defaultRpidHash =
    "0x49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d9763"
  public defaultFlagsInt = "0x05"
  public defaultSignCount = "0x00000002"

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
    const clientDataJson = {
      type: "webauthn.get",
      challenge: byte.normalize(challenge).toString("base64url"),
      origin: "http://localhost:5173",
      crossOrigin: false
    }
    const clientData = JSON.stringify(clientDataJson, [
      "type",
      "challenge",
      "origin",
      "crossOrigin"
    ])

    const webAuthnHash = this.getWebAuthnHash(
      this.getAuthenticatorData(),
      clientData
    )
    let { r, s } = p256.sign(webAuthnHash.replace(/^0x/, ""), this.privateKey)
    if (s > p256.CURVE.n / 2n) {
      s = p256.CURVE.n - s
    }

    const flagsInt = Number(this.defaultFlagsInt)
    const authnticatorDataJson = {
      rpIdHash: this.defaultRpidHash,
      flags: {
        up: !!(flagsInt & (1 << 0)), // User Presence
        uv: !!(flagsInt & (1 << 2)), // User Verified
        be: !!(flagsInt & (1 << 3)), // Backup Eligibility
        bs: !!(flagsInt & (1 << 4)), // Backup State
        at: !!(flagsInt & (1 << 6)), // Attested Credential Data Present
        ed: !!(flagsInt & (1 << 7)), // Extension Data Present
        flagsInt: flagsInt
      },
      counter: Number(this.defaultSignCount)
    }
    return {
      signature: {
        r: r,
        s: s
      },
      clientData: clientDataJson,
      authenticatorData: authnticatorDataJson
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
      this.defaultRpidHash,
      this.defaultFlagsInt,
      this.defaultSignCount
    ])
  }
}
