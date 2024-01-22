import { useEffect } from "react"
import { runtime } from "webextension-polyfill"

import { objectFromUrlParams } from "~packages/util/url"
import { createWebAuthn } from "~packages/webAuthn"
import { PortName } from "~packages/webAuthn/tabs/port"
import type {
  WebAuthnCreation,
  WebAuthnError,
  WebAuthnRegistration
} from "~packages/webAuthn/typing"

export const CreateWebAuthn = () => {
  useEffect(() => {
    // Extract parameters from the URL
    const urlParams = window.location.href.split("?")
    const params = objectFromUrlParams(
      urlParams[urlParams.length - 1].replace(window.location.hash, "")
    )
    // Prepare WebAuthn creation data
    const webAuthnCreation: WebAuthnCreation = {
      user: params.user,
      challenge: params.challengeCreation
    } as WebAuthnCreation

    // Connect to the background script
    const port = runtime.connect({
      name: PortName.port_createWebAuthn
    })

    // Create a WebAuthn credential
    createWebAuthn(webAuthnCreation)
      .then((cred) => {
        // Send the credential details to the background script
        port.postMessage({
          origin: cred.origin,
          credentialId: cred.credentialId,
          publicKey: {
            x: cred.publicKey.x.toString(), // Resolve Uncaught (in promise) Error: Could not serialize message.
            y: cred.publicKey.y.toString() // Resolve Uncaught (in promise) Error: Could not serialize message.
          }
        } as WebAuthnRegistration)
      })
      .catch((error) => {
        console.error(`[tab][createWebAuthn] Error: ${error}`)
        port.postMessage({
          error: `[tab][createWebAuthn] Error: ${error}`
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

export default CreateWebAuthn
