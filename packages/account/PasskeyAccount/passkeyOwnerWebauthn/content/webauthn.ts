import { runtime, type Runtime } from "webextension-polyfill"

import { PortName } from "~packages/account/PasskeyAccount/passkeyOwnerWebauthn/tabs/port"
import json from "~packages/util/json"
import { createWebAuthn, requestWebAuthn } from "~packages/webauthn"
import type {
  WebAuthnAuthentication,
  WebAuthnCreation,
  WebAuthnError,
  WebAuthnRegistration,
  WebAuthnRequest
} from "~packages/webauthn/typing"

export const contentCreateWebAuthn = async (
  params?: WebAuthnCreation
): Promise<WebAuthnRegistration> => {
  const port = runtime.connect({
    name: PortName.port_createWebAuthn
  })
  try {
    console.log(
      `[content][message][createWebAuthn] params: ${JSON.stringify(
        params,
        null,
        2
      )}`
    )
    const cred = await createWebAuthn(params)
    console.log(
      `[content][message][createWebAuthn] cred: ${json.toString(cred)}`
    )
    port.onMessage.addListener((message) => {
      console.log(
        `[content][message][createWebAuthn] port: ${JSON.stringify(
          message,
          null,
          2
        )}`
      )
    })
    // send to background that create this window
    port.postMessage({
      origin: cred.origin,
      credentialId: cred.credentialId,
      publicKeyX: cred.publicKeyX.toString(), // Resolve Uncaught (in promise) Error: Could not serialize message.
      publicKeyY: cred.publicKeyY.toString() // Resolve Uncaught (in promise) Error: Could not serialize message.
    } as WebAuthnRegistration)
    return cred
  } catch (error) {
    console.error(`[content][createWebAuthn] Error: ${error}`)
    port.postMessage({
      error: `[content][createWebAuthn] Error: ${error}`
    } as WebAuthnError)
  }
}

export const contentRequestWebAuthn = async (
  params: WebAuthnRequest
): Promise<WebAuthnAuthentication> => {
  const port = runtime.connect({
    name: PortName.port_requestWebAuthn
  })
  try {
    console.log(
      `[content][message][requestWebAuthn] params: ${JSON.stringify(
        params,
        null,
        2
      )}`
    )
    const sig = await requestWebAuthn(params)
    console.log(
      `[content][message][requestWebAuthn] sig: ${json.toString(sig)}`
    )
    port.onMessage.addListener((message) => {
      console.log(
        `[content][message][requestWebAuthn] port: ${JSON.stringify(
          message,
          null,
          2
        )}`
      )
    })
    // send to background that create this window
    port.postMessage({
      authenticatorData: sig.authenticatorData,
      clientDataJson: sig.clientDataJson,
      sigantureR: sig.sigantureR.toString(), // Resolve Uncaught (in promise) Error: Could not serialize message.
      signatureS: sig.signatureS.toString() // Resolve Uncaught (in promise) Error: Could not serialize message.
    } as WebAuthnAuthentication)
    return sig
  } catch (error) {
    console.error(`[content][requestWebAuthn] Error: ${error}`)
    port.postMessage({
      error: `[content][requestWebAuthn] Error: ${error}`
    } as WebAuthnError)
  }
}
