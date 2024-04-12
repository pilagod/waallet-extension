import { runtime, type Runtime } from "webextension-polyfill"

import { format } from "~packages/util/json"
import { createWebAuthn, requestWebAuthn } from "~packages/webAuthn"
import { PortName } from "~packages/webAuthn/tabs/port"
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
    console.log(`[content][message][createWebAuthn] params: ${format(params)}`)
    const cred = await createWebAuthn(params)
    console.log(`[content][message][createWebAuthn] cred: ${format(cred)}`)
    port.onMessage.addListener((message) => {
      console.log(`[content][message][createWebAuthn] port: ${format(message)}`)
    })
    // send to background that create this window
    port.postMessage({
      origin: cred.origin,
      credentialId: cred.credentialId,
      publicKey: {
        x: cred.publicKey.x.toString(), // Resolve Uncaught (in promise) Error: Could not serialize message.
        y: cred.publicKey.y.toString() // Resolve Uncaught (in promise) Error: Could not serialize message.
      }
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
    console.log(`[content][message][requestWebAuthn] params: ${format(params)}`)
    const sig = await requestWebAuthn(params)
    console.log(`[content][message][requestWebAuthn] sig: ${format(sig)}`)
    port.onMessage.addListener((message) => {
      console.log(
        `[content][message][requestWebAuthn] port: ${format(message)}`
      )
    })
    // send to background that create this window
    port.postMessage({
      authenticatorData: sig.authenticatorData,
      clientDataJson: sig.clientDataJson,
      signature: {
        r: sig.signature.r.toString(), // Resolve Uncaught (in promise) Error: Could not serialize message.
        s: sig.signature.s.toString() // Resolve Uncaught (in promise) Error: Could not serialize message.
      }
    } as WebAuthnAuthentication)
    return sig
  } catch (error) {
    console.error(`[content][requestWebAuthn] Error: ${error}`)
    port.postMessage({
      error: `[content][requestWebAuthn] Error: ${error}`
    } as WebAuthnError)
  }
}
