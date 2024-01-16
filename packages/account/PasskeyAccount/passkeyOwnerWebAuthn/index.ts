import { isoBase64URL, isoUint8Array } from "@simplewebauthn/server/helpers"
import * as ethers from "ethers"

import type { PasskeyOwner } from "~packages/account/PasskeyAccount/passkeyOwner"
import json from "~packages/util/json"
import { webAuthnRequestAsyncWindow } from "~packages/webAuthn/background/webAuthn"
import type { WebAuthnAuthentication } from "~packages/webAuthn/typing"
import type { BytesLike, UrlB64String } from "~typing"

export class PasskeyOwnerWebAuthn implements PasskeyOwner {
  public credentialId: UrlB64String

  public use(credentialId: UrlB64String) {
    this.credentialId = credentialId
  }

  public async sign(challenge: BytesLike): Promise<string> {
    if (!this.credentialId) {
      throw new Error("Credential id is not set")
    }

    const challengeUrlB64 = isoBase64URL.fromBuffer(
      typeof challenge === "string"
        ? challenge.startsWith("0x")
          ? isoUint8Array.fromHex(challenge.slice(2))
          : isoUint8Array.fromHex(challenge)
        : challenge
    )

    const webAuthnAuthentication: WebAuthnAuthentication =
      (await webAuthnRequestAsyncWindow({
        credentialId: this.credentialId,
        challenge: challengeUrlB64
      })) as WebAuthnAuthentication

    console.log(
      `[passkeyOwnerWebAuthn] webAuthnAuthentication: ${json.stringify(
        webAuthnAuthentication,
        null,
        2
      )}`
    )

    const authenticatorDataUint8Arr = isoUint8Array.fromHex(
      webAuthnAuthentication.authenticatorData.slice(2)
    )

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
        authenticatorDataUint8Arr,
        true,
        webAuthnAuthentication.clientDataJson,
        23,
        1,
        BigInt(webAuthnAuthentication.signature.r),
        BigInt(webAuthnAuthentication.signature.s)
      ]
    )
    return signature
  }
}
