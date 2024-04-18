import { browserSupportsWebAuthn } from "@simplewebauthn/browser"
import { isoBase64URL, isoUint8Array } from "@simplewebauthn/server/helpers"
import * as ethers from "ethers"
import browser from "webextension-polyfill"

import type { PasskeyOwner } from "~packages/account/PasskeyAccount/passkeyOwner"
import json from "~packages/util/json"
import { requestWebAuthn } from "~packages/webAuthn"
import { requestWebAuthn as requestWebAuthnInBackground } from "~packages/webAuthn/background/webAuthn"
import type { B64UrlString, BytesLike } from "~typing"

export class PasskeyOwnerWebAuthn implements PasskeyOwner {
  public constructor(private credentialId: B64UrlString) {}

  public getCredentialId() {
    return this.credentialId
  }

  public async sign(
    challenge: BytesLike,
    metadata?: {
      sender?: browser.Runtime.MessageSender
    }
  ): Promise<string> {
    const challengeB64Url = isoBase64URL.fromBuffer(
      typeof challenge === "string"
        ? challenge.startsWith("0x")
          ? isoUint8Array.fromHex(challenge.slice(2))
          : isoUint8Array.fromHex(challenge)
        : challenge
    )
    const webAuthnAuthentication = await (this.supportsWebAuthn()
      ? this.authenticateInPlace(challengeB64Url)
      : this.authenticateInBackground(challengeB64Url, metadata))
    console.log(
      `[passkeyOwnerWebAuthn] webAuthnAuthentication: ${json.stringify(
        webAuthnAuthentication,
        null,
        2
      )}`
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
        isoUint8Array.fromHex(
          webAuthnAuthentication.authenticatorData.slice(2)
        ),
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

  // Avoid exceptions in browserSupportsWebAuthn() to ensure successful webAuthn operations.
  private supportsWebAuthn(): boolean {
    let supportsWebAuthn: boolean = false
    try {
      supportsWebAuthn = browserSupportsWebAuthn()
    } catch (e) {
      if (
        e instanceof ReferenceError &&
        e.message.includes("window is not defined")
      ) {
        console.warn("An error occurred while checking WebAuthn support:", e)
      } else {
        console.error(
          "An unexpected error occurred while checking WebAuthn support:",
          e
        )
        supportsWebAuthn = false
      }
    }
    return supportsWebAuthn
  }

  private authenticateInPlace(challenge: B64UrlString) {
    return requestWebAuthn({
      credentialId: this.credentialId,
      challenge
    })
  }

  private async authenticateInBackground(
    challenge: B64UrlString,
    metadata?: {
      sender?: browser.Runtime.MessageSender
    }
  ) {
    const { result: webAuthnAuthenticationPromise, cancel } =
      await requestWebAuthnInBackground({
        credentialId: this.credentialId,
        challenge: challenge
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

    return webAuthnAuthenticationPromise
  }
}
