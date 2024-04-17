import {
  isoBase64URL,
  isoUint8Array,
  parseAuthenticatorData
} from "@simplewebauthn/server/helpers"
import browser from "webextension-polyfill"

import json from "~packages/util/json"
import { requestWebAuthn } from "~packages/webAuthn/background/webAuthn"
import type { B64UrlString, BytesLike } from "~typing"

import type { WebAuthnValidatorOwner } from "../validator"

export class WebAuthnOwner implements WebAuthnValidatorOwner {
  public credentialId: B64UrlString

  public use(credentialId: B64UrlString) {
    this.credentialId = credentialId
  }

  public async sign(
    challenge: BytesLike,
    metadata?: {
      sender?: browser.Runtime.MessageSender
    }
  ) {
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

    const { result: webAuthnAuthenticationPromise, cancel } =
      await requestWebAuthn({
        credentialId: this.credentialId,
        challenge: challengeUrlB64
      })

    if (metadata?.sender) {
      const senderOnRemovedHandler = async (tabId: number) => {
        if (tabId !== metadata.sender.tab.id) {
          return
        }
        await cancel()
        browser.tabs.onRemoved.removeListener(senderOnRemovedHandler)
      }
      browser.tabs.onRemoved.addListener(senderOnRemovedHandler)
    }

    const webAuthnAuthentication = await webAuthnAuthenticationPromise
    console.log(
      `[passkeyOwnerWebAuthn] webAuthnAuthentication: ${json.stringify(
        webAuthnAuthentication,
        null,
        2
      )}`
    )

    const authData = parseAuthenticatorData(
      Uint8Array.from(
        Buffer.from(webAuthnAuthentication.authenticatorData.slice(2), "hex")
      )
    )

    const authnticatorDataJson = {
      rpIdHash: Buffer.from(authData.rpIdHash).toString("hex"),
      flags: authData.flags,
      counter: authData.counter
    }

    return {
      signature: {
        r: webAuthnAuthentication.signature.r,
        s: webAuthnAuthentication.signature.s
      },
      clientData: JSON.parse(webAuthnAuthentication.clientDataJson),
      authenticatorData: authnticatorDataJson
    }
  }
}
