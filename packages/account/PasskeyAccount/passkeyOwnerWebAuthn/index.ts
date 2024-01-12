import { isoBase64URL, isoUint8Array } from "@simplewebauthn/server/helpers"
import * as ethers from "ethers"
import { runtime } from "webextension-polyfill"

import type { PasskeyOwner } from "~packages/account/PasskeyAccount/passkeyOwner"
import { webAuthnWindowAsync } from "~packages/account/PasskeyAccount/passkeyOwnerWebAuthn/background/webAuthn"
import json from "~packages/util/json"
import type {
  WebAuthnAuthentication,
  WebAuthnCreation,
  WebAuthnRegistration,
  WebAuthnRequest
} from "~packages/webAuthn/typing"
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

    const createWindowUrl = `${runtime.getURL(
      "tabs/requestWebauthn.html"
    )}?credentialId=${this.credentialId}&challengeRequest=${challengeUrlB64}`

    const webAuthnAuthentication: WebAuthnAuthentication =
      (await webAuthnWindowAsync(createWindowUrl)) as WebAuthnAuthentication

    console.log(
      `[passkeyOwnerWebAuthn] webAuthnAuthentication: ${json.toString(
        webAuthnAuthentication
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
        BigInt(webAuthnAuthentication.sigantureR),
        BigInt(webAuthnAuthentication.signatureS)
      ]
    )
    return signature
  }

  // Temp: Create and set the new WebAuthn credential ID.
  public async new(opts?: WebAuthnCreation): Promise<WebAuthnRegistration> {
    const createWindowUrl = `${runtime.getURL(
      "tabs/createWebauthn.html"
    )}?user=${encodeURI(opts?.user)}&challengeCreation=${opts?.challenge}`

    const webAuthnCreation = (await webAuthnWindowAsync(
      createWindowUrl
    )) as WebAuthnRegistration

    this.credentialId = webAuthnCreation.credentialId

    return webAuthnCreation
  }
}
