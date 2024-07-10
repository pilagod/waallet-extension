import type { PlasmoCSConfig } from "plasmo"

import { listen } from "@plasmohq/messaging/message"

import { format } from "~packages/util/json"
import type { WebAuthnCreation, WebAuthnRequest } from "~packages/webAuthn"
import {
  contentCreateWebAuthn,
  contentRequestWebAuthn
} from "~packages/webAuthn/content"
import { ContentMethod } from "~packages/webAuthn/content/method"
import type { B64UrlString } from "~typing"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  // The "all_frames" field determines whether files are injected into all frames meeting URL requirements or only into the top frame in a tab.
  all_frames: true,
  // Specifies the timing for injecting JavaScript files into the web page. The default is document_idle, injecting a script into a target context to run at document_idle. If the script returns a promise, the browser waits for it to settle before returning the result.
  run_at: "document_idle"
}

// Record the latest Credential ID for signing in future WebAuthn requests.
let credentialId: B64UrlString = ""
// Non-hook usage reference: https://github.com/PlasmoHQ/plasmo/blob/888b6015c3829872f78428ca0f07640989f6608c/api/messaging/src/hook.ts#L18
const Messages = () => {
  listen<Record<string, any>, Record<string, any>>(async (req, res) => {
    console.log(`[contents][messages] req: ${format(req)}`)

    if (!req.name) {
      console.log(`[contents][messages] status: method not found`)
      return
    }

    switch (req.name) {
      case ContentMethod.content_createWebAuthn: {
        const cred = await contentCreateWebAuthn(req.body as WebAuthnCreation)
        credentialId = cred.credentialId // Record the credentialId

        // When requesting the Content Script to create a WebAuthn, the response is consistently undefined.
        // res.send(cred)
        break
      }
      case ContentMethod.content_requestWebAuthn: {
        const sig = await contentRequestWebAuthn({
          credentialId: credentialId ? credentialId : req.body?.credentialId, // credentialId,
          challenge: req.body.challenge
        } as WebAuthnRequest)
        // When requesting the Content Script to create a WebAuthn, the response is consistently undefined.
        // res.send(cred)
        break
      }
      default: {
        // Send the information back to the window or tab that called sendToContentScript().
        res.send(req.body)
        console.log(`[contents][messages] status: No method matching`)
        break
      }
    }
  })
}

Messages()
