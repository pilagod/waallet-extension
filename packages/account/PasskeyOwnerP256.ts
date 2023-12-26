import { createHash } from "node:crypto"
import { p256 } from "@noble/curves/p256"
import * as ethers from "ethers"

import type { BytesLike } from "~typing"

import type { PasskeyOwner } from "./PasskeyOwner"

export class PasskeyOwnerP256 implements PasskeyOwner {
  private credentialId: string
  private privateKey: Uint8Array

  public set(credentialId: string) {
    if (this.credentialId === credentialId) {
      return
    }
    this.credentialId = credentialId
    this.privateKey = p256.utils.randomPrivateKey()
  }

  public async sign(challenge: BytesLike) {
    if (!this.credentialId) {
      throw new Error("Credential id is not set")
    }
    const {
      message,
      authenticatorData,
      clientDataJson,
      clientDataJsonChallengeIndex,
      clientDataJsonTypeIndex
    } = this.getMessage(challenge)
    const { r, s } = p256.sign(message, this.privateKey)
    // (
    //     bytes memory authenticatorData,
    //     bool requireUserVerification,
    //     string memory clientDataJSON,
    //     uint256 challengeLocation,
    //     uint256 responseTypeLocation,
    //     uint256 r,
    //     uint256 s
    // ) = abi.decode(
    //     userOp.signature,
    //     (bytes, bool, string, uint256, uint256, uint256, uint256)
    // );
    const signature = ethers.AbiCoder.defaultAbiCoder().encode(
      ["bytes", "bool", "string", "uint256", "uint256", "uint256", "uint256"],
      [
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
    const clientDataJson = this.getClientDataJson(this.normalize(challenge))
    const message = this.sha256(
      `${authenticatorData}${this.sha256(clientDataJson)}`
    )
    return {
      message,
      authenticatorData,
      clientDataJson,
      clientDataJsonChallengeIndex: 23,
      clientDataJsonTypeIndex: 1
    }
  }

  private normalize(challenge: BytesLike) {
    if (challenge instanceof Uint8Array) {
      return challenge
    }
    const start = challenge.startsWith("0x") ? 2 : 0
    return Uint8Array.from(
      challenge
        .slice(start)
        .split("")
        .map((c) => c.charCodeAt(0))
    )
  }

  private getAuthenticatorData() {
    return "4fb20856f24a6ae7dafc2781090ac8477ae6e2bd072660236cc614c6fb7c2ea00500000001"
  }

  private getClientDataJson(challenge: Uint8Array) {
    const clientJsonData = {
      type: "webauthn.get",
      challenge: Buffer.from(challenge).toString("base64url"),
      origin: "https://webauthn.passwordless.id",
      crossOrigin: false
    }
    return JSON.stringify(clientJsonData)
  }

  private sha256(data: BytesLike) {
    return createHash("sha256").update(data).digest("hex")
  }
}
