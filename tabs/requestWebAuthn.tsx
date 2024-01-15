import { useEffect } from "react"
import { runtime } from "webextension-polyfill"

import { objectFromUrlParams } from "~packages/util/url"
import { requestWebAuthn } from "~packages/webAuthn"
import { PortName } from "~packages/webAuthn/tabs/port"
import type {
  WebAuthnAuthentication,
  WebAuthnError,
  WebAuthnRequest
} from "~packages/webAuthn/typing"

export const RequestWebAuthn = () => {
  useEffect(() => {
    // Extract parameters from the URL
    const urlParams = window.location.href.split("?")
    const params = objectFromUrlParams(
      urlParams[urlParams.length - 1].replace(window.location.hash, "")
    )
    // Prepare WebAuthn request data
    const webAuthnRequest: WebAuthnRequest = {
      credentialId: params.credentialId,
      challenge: params.challengeRequest
    } as WebAuthnRequest

    // Connect to the background script
    const port = runtime.connect({
      name: PortName.port_requestWebAuthn
    })

    // Request a WebAuthn credential
    requestWebAuthn(webAuthnRequest)
      .then((signature) => {
        // Send the signature details to the background script
        port.postMessage({
          authenticatorData: signature.authenticatorData,
          clientDataJson: signature.clientDataJson,
          sigantureR: signature.sigantureR.toString(), // Resolve Uncaught (in promise) Error: Could not serialize message.
          signatureS: signature.signatureS.toString() // Resolve Uncaught (in promise) Error: Could not serialize message.
        } as WebAuthnAuthentication)
      })
      .catch((error) => {
        console.error(`[tab][requestWebAuthn] Error: ${error}`)
        port.postMessage({
          error: `[tab][requestWebAuthn] Error: ${error}`
        } as WebAuthnError)
      })
      .finally(() => {
        // Disconnect the port
        port.disconnect()
        // Close this window asynchronously
        window.onbeforeunload = null
        setTimeout(() => {
          window.close()
        }, 100) // After 0.1 seconds
      })
  }, [])
}

export default RequestWebAuthn
