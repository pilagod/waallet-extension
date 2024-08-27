import { browserSupportsWebAuthn } from "@simplewebauthn/browser"
import browser from "webextension-polyfill"

import type {
  PasskeyOwner,
  PasskeyPublicKey
} from "~packages/account/PasskeyAccount/passkeyOwner"
import { Bytes } from "~packages/primitive"
import { format } from "~packages/util/json"
import {
  createWebAuthn,
  requestWebAuthn,
  type WebAuthnAuthentication
} from "~packages/webAuthn"
import { requestWebAuthn as requestWebAuthnInBackground } from "~packages/webAuthn/background"
import type { B64UrlString, BytesLike } from "~typing"

export class PasskeyOwnerWebAuthn implements PasskeyOwner {
  public static async register() {
    const { credentialId, publicKey } = await createWebAuthn()
    return new PasskeyOwnerWebAuthn(credentialId, publicKey)
  }

  public constructor(
    private credentialId: B64UrlString,
    private publicKey?: PasskeyPublicKey
  ) {}

  public getCredentialId() {
    return this.credentialId
  }

  public getPublicKey() {
    return this.publicKey ?? null
  }

  public async sign(
    challenge: BytesLike,
    metadata?: {
      sender?: browser.Runtime.MessageSender
    }
  ): Promise<WebAuthnAuthentication> {
    const challengeB64Url = Bytes.wrap(challenge).unwrap("base64url")
    const webAuthnAuthentication = await (this.isWebAuthnAvailable()
      ? this.authenticateInPlace(challengeB64Url)
      : this.authenticateInBackground(challengeB64Url, metadata))
    console.log(
      `[passkeyOwnerWebAuthn] webAuthnAuthentication: ${format(
        webAuthnAuthentication
      )}`
    )
    return webAuthnAuthentication
  }

  private isWebAuthnAvailable(): boolean {
    try {
      return browserSupportsWebAuthn()
    } catch (e) {
      console.warn(`An error occurred while checking WebAuthn support: ${e}`)
      return false
    }
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
