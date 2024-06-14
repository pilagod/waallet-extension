import { p256 } from "@noble/curves/p256"
import * as ethers from "ethers"

import byte from "~packages/util/byte"
import cryptography from "~packages/util/cryptography"
import type { BytesLike } from "~typing"

import type { PasskeyOwner } from "./passkeyOwner"

export class PasskeyOwnerP256 implements PasskeyOwner {
  public privateKey: Uint8Array
  public publicKey: Uint8Array
  public x: bigint
  public y: bigint

  public constructor() {
    this.privateKey = p256.utils.randomPrivateKey()
    this.publicKey = p256.getPublicKey(this.privateKey)

    const point = p256.ProjectivePoint.fromPrivateKey(this.privateKey)
    this.x = point.x
    this.y = point.y
  }

  public getCredentialId() {
    return Buffer.from("CREDENTIAL_ID_STUB").toString("base64url")
  }

  public getPublicKey() {
    return {
      x: this.x,
      y: this.y
    }
  }

  public async sign(challenge: BytesLike) {
    const {
      message,
      authenticatorData,
      clientDataJson,
      clientDataJsonChallengeIndex,
      clientDataJsonTypeIndex
    } = this.getMessage(challenge)

    let { r, s } = p256.sign(message, this.privateKey)
    if (s > p256.CURVE.n / 2n) {
      s = p256.CURVE.n - s
    }
    const signature = ethers.AbiCoder.defaultAbiCoder().encode(
      [
        "bool",
        "bytes",
        "bool",
        "string",
        "uint256",
        "uint256",
        "uint256",
        "uint256"
      ],
      [
        false,
        Uint8Array.from(Buffer.from(authenticatorData, "hex")),
        true,
        clientDataJson,
        clientDataJsonChallengeIndex,
        clientDataJsonTypeIndex,
        r,
        s
      ]
    )
    return signature
  }

  private getMessage(challenge: BytesLike) {
    const authenticatorData = this.getAuthenticatorData()
    const clientDataJson = this.getClientDataJson(challenge)
    const message = byte
      .sha256(
        `${authenticatorData}${byte.sha256(clientDataJson).toString("hex")}`
      )
      .toString("hex")
    return {
      message,
      authenticatorData,
      clientDataJson,
      clientDataJsonChallengeIndex: 23,
      clientDataJsonTypeIndex: 1
    }
  }

  private getAuthenticatorData() {
    return "4fb20856f24a6ae7dafc2781090ac8477ae6e2bd072660236cc614c6fb7c2ea00500000001"
  }

  private getClientDataJson(challenge: BytesLike) {
    const clientJsonData = {
      type: "webauthn.get",
      challenge: byte
        .normalize(cryptography.toEthSignedMessageHash(challenge))
        .toString("base64url"),
      origin: "https://webauthn.passwordless.id",
      crossOrigin: false
    }
    return JSON.stringify(clientJsonData)
  }
}
