import { isoBase64URL, isoUint8Array } from "@simplewebauthn/server/helpers"
import * as ethers from "ethers"
import { runtime } from "webextension-polyfill"

import type { PasskeyOwner } from "~packages/account/PasskeyAccount/passkeyOwner"
import { webauthnWindowAsync } from "~packages/account/PasskeyAccount/passkeyOwnerWebauthn/background/webauthn"
import json from "~packages/util/json"
import type {
  WebauthnAuthentication,
  WebauthnCreation,
  WebauthnRegistration,
  WebauthnRequest
} from "~packages/webauthn/typing"
import type { BytesLike, UrlB64String } from "~typing"

export class PasskeyOwnerWebauthn implements PasskeyOwner {
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

    const webauthnAuthentication: WebauthnAuthentication =
      (await webauthnWindowAsync(createWindowUrl)) as WebauthnAuthentication

    console.log(
      `[passkeyOwnerWebauthn] webauthnAuthentication: ${json.toString(
        webauthnAuthentication
      )}`
    )

    const authenticatorDataUint8Arr = isoUint8Array.fromHex(
      webauthnAuthentication.authenticatorData.slice(2)
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
        webauthnAuthentication.clientDataJson,
        23,
        1,
        BigInt(webauthnAuthentication.sigantureR),
        BigInt(webauthnAuthentication.signatureS)
      ]
    )
    return signature
  }

  // Temp: Create and set the new WebAuthn credential ID.
  public async new(opts?: WebauthnCreation): Promise<WebauthnRegistration> {
    const createWindowUrl = `${runtime.getURL(
      "tabs/createWebauthn.html"
    )}?user=${encodeURI(opts?.user)}&challengeCreation=${opts?.challenge}`

    const webauthnCreation = (await webauthnWindowAsync(
      createWindowUrl
    )) as WebauthnRegistration

    this.credentialId = webauthnCreation.credentialId

    return webauthnCreation
  }
}
