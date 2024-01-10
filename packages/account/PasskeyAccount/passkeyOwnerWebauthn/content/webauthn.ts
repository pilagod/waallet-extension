import { runtime, type Runtime } from "webextension-polyfill"

import { PortName } from "~packages/account/PasskeyAccount/passkeyOwnerWebauthn/tabs/port"
import { createWebauthn, requestWebauthn } from "~packages/webauthn"
import type {
  WebauthnAuthentication,
  WebauthnCreation,
  WebauthnError,
  WebauthnRegistration,
  WebauthnRequest
} from "~packages/webauthn/typing"

export const contentCreateWebauthn = async (
  params?: WebauthnCreation
): Promise<WebauthnRegistration> => {
  const port = runtime.connect({
    name: PortName.port_createWebauthn
  })
  try {
    console.log(
      `[content][message][createWebauthn] params: ${JSON.stringify(
        params,
        null,
        2
      )}`
    )
    const cred = await createWebauthn(params)
    console.log(
      `[content][message][createWebauthn] cred: ${JSON.stringify(
        cred,
        (_, value) => {
          return typeof value === "bigint" ? value.toString() : value
        },
        2
      )}`
    )
    port.onMessage.addListener((message) => {
      console.log(
        `[content][message][createWebauthn] port: ${JSON.stringify(
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
    } as WebauthnRegistration)
    return cred
  } catch (error) {
    console.error(`[content][createWebauthn] Error: ${error}`)
    port.postMessage({
      error: `[content][createWebauthn] Error: ${error}`
    } as WebauthnError)
  }
}

export const contentRequestWebauthn = async (
  params: WebauthnRequest
): Promise<WebauthnAuthentication> => {
  const port = runtime.connect({
    name: PortName.port_requestWebauthn
  })
  try {
    console.log(
      `[content][message][requestWebauthn] params: ${JSON.stringify(
        params,
        null,
        2
      )}`
    )
    const sig = await requestWebauthn(params)
    console.log(
      `[content][message][requestWebauthn] sig: ${JSON.stringify(
        sig,
        (_, value) => {
          return typeof value === "bigint" ? value.toString() : value
        },
        2
      )}`
    )
    port.onMessage.addListener((message) => {
      console.log(
        `[content][message][requestWebauthn] port: ${JSON.stringify(
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
    } as WebauthnAuthentication)
    return sig
  } catch (error) {
    console.error(`[content][requestWebauthn] Error: ${error}`)
    port.postMessage({
      error: `[content][requestWebauthn] Error: ${error}`
    } as WebauthnError)
  }
}
