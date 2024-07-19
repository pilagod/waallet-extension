import { p256 } from "@noble/curves/p256"

import { Bytes } from "~packages/primitive"
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
    const { message, authenticatorData, clientDataJson } =
      this.getMessage(challenge)

    let { r, s } = p256.sign(message, this.privateKey)
    if (s > p256.CURVE.n / 2n) {
      s = p256.CURVE.n - s
    }

    return {
      authenticatorData,
      clientDataJson,
      signature: { r, s }
    }
  }

  private getMessage(challenge: BytesLike) {
    const authenticatorData = this.getAuthenticatorData()
    const clientDataJson = this.getClientDataJson(challenge)
    const message = Bytes.wrap(authenticatorData)
      .concat(Bytes.wrap(clientDataJson).sha256())
      .sha256()
    return {
      message,
      authenticatorData,
      clientDataJson
    }
  }

  private getAuthenticatorData() {
    return "4fb20856f24a6ae7dafc2781090ac8477ae6e2bd072660236cc614c6fb7c2ea00500000001"
  }

  private getClientDataJson(challenge: BytesLike) {
    const clientDataJson = {
      type: "webauthn.get",
      challenge: Bytes.wrap(challenge).eip191().unwrap("base64url"),
      origin: "https://webauthn.passwordless.id",
      crossOrigin: false
    }
    return JSON.stringify(clientDataJson)
  }
}
