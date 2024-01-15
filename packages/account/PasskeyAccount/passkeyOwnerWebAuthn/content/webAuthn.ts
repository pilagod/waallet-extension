import { runtime, type Runtime } from "webextension-polyfill"

import { PortName } from "~packages/account/PasskeyAccount/passkeyOwnerWebAuthn/tabs/port"
import json from "~packages/util/json"
import { createWebAuthn, requestWebAuthn } from "~packages/webAuthn"
import type {
  WebAuthnAuthentication,
  WebAuthnCreation,
  WebAuthnError,
  WebAuthnRegistration,
  WebAuthnRequest
} from "~packages/webAuthn/typing"

export const contentCreateWebAuthn = async (
  params?: WebAuthnCreation
): Promise<WebAuthnRegistration> => {
  const port = runtime.connect({
    name: PortName.port_createWebAuthn
  })
  try {
    console.log(
      `[content][message][createWebAuthn] params: ${json.stringify(
        params,
        null,
        2
      )}`
    )
    const cred = await createWebAuthn(params)
    console.log(
      `[content][message][createWebAuthn] cred: ${json.stringify(
        cred,
        null,
        2
      )}`
    )
    port.onMessage.addListener((message) => {
      console.log(
        `[content][message][createWebAuthn] port: ${json.stringify(
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
      `[content][message][requestWebAuthn] params: ${json.stringify(
        params,
        null,
        2
      )}`
    )
    const sig = await requestWebAuthn(params)
    console.log(
      `[content][message][requestWebAuthn] sig: ${json.stringify(sig, null, 2)}`
    )
    port.onMessage.addListener((message) => {
      console.log(
        `[content][message][requestWebAuthn] port: ${json.stringify(
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
