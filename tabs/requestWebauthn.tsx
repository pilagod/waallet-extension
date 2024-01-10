import { useEffect } from "react"
import { runtime } from "webextension-polyfill"

import { PortName } from "~packages/account/PasskeyAccount/passkeyOwnerWebauthn/tabs/port"
import { objectFromUrlParams } from "~packages/util/url"
import { requestWebauthn } from "~packages/webauthn"
import type {
  WebauthnAuthentication,
  WebauthnRequest
} from "~packages/webauthn/typing"

export const RequestWebauthn = () => {
  useEffect(() => {
    // Extract parameters from the URL
    const urlParams = window.location.href.split("?")
    const params = objectFromUrlParams(
      urlParams[urlParams.length - 1].replace(window.location.hash, "")
    )
    // Prepare WebAuthn request data
    const webauthnRequest: WebauthnRequest = {
      credentialId: params.credentialId,
      challenge: params.challengeRequest
    } as WebauthnRequest

    // Connect to the background script
    const port = runtime.connect({
      name: PortName.port_requestWebauthn
    })

    // Request a WebAuthn credential
    requestWebauthn(webauthnRequest)
      .then((signature) => {
        // Send the signature details to the background script
        port.postMessage({
          authenticatorData: signature.authenticatorData,
          clientDataJson: signature.clientDataJson,
          sigantureR: signature.sigantureR.toString(), // Resolve Uncaught (in promise) Error: Could not serialize message.
          signatureS: signature.signatureS.toString() // Resolve Uncaught (in promise) Error: Could not serialize message.
        } as WebauthnAuthentication)
      })
      .catch((error) => {
        port.postMessage({ error: `[tab][createWebauthn] Error: ${error}` })
      })
      .finally(() => {
        // Disconnect the port
        port.disconnect()
        // Close this window asynchronously
        setTimeout(() => {
          window.onbeforeunload = null
          window.close()
        }, 100) // After 0.1 seconds
      })
  }, [])
}

export default RequestWebauthn
