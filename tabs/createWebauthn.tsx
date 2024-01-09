import { useEffect } from "react"
import { runtime } from "webextension-polyfill"

import { PortName } from "~packages/account/PasskeyAccount/passkeyOwnerWebauthn/tabs/port"
import { objectFromUrlParams } from "~packages/util/url"
import { createWebauthn } from "~packages/webauthn"
import type {
  WebauthnCreation,
  WebauthnRegistration
} from "~packages/webauthn/typing"

export const CreateWebauthn = () => {
  useEffect(() => {
    // Extract parameters from the URL
    const urlParams = window.location.href.split("?")
    const params = objectFromUrlParams(
      urlParams[urlParams.length - 1].replace(window.location.hash, "")
    )
    // Prepare WebAuthn creation data
    const webauthnCreation: WebauthnCreation = {
      user: params.user,
      challenge: params.challengeCreation
    } as WebauthnCreation

    // Connect to the background script
    const port = runtime.connect({
      name: PortName.port_createWebauthn
    })

    // Create a WebAuthn credential
    createWebauthn(webauthnCreation)
      .then((credential) => {
        // Send the credential details to the background script
        port.postMessage({
          origin: credential.origin,
          credentialId: credential.credentialId,
          publicKeyX: credential.publicKeyX.toString(), // Resolve Uncaught (in promise) Error: Could not serialize message.
          publicKeyY: credential.publicKeyY.toString() // Resolve Uncaught (in promise) Error: Could not serialize message.
        } as WebauthnRegistration)
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

export default CreateWebauthn
