import { useCallback, useEffect, useState } from "react"
import { runtime, type Runtime } from "webextension-polyfill"

import { sendToContentScript } from "@plasmohq/messaging"

import json from "~packages/util/json"
import { objectFromUrlParams } from "~packages/util/url"
import { createWebAuthn, requestWebAuthn } from "~packages/webAuthn"
import {
  ContentMethod,
  type ContentRequestArguments
} from "~packages/webAuthn/content/method"
import { PortName } from "~packages/webAuthn/tabs/port"
import type {
  WebAuthnAuthentication,
  WebAuthnCreation,
  WebAuthnError,
  WebAuthnRegistration,
  WebAuthnRequest
} from "~packages/webAuthn/typing"

export function WebAuthnDevtool() {
  const [webAuthnCreation, setWebAuthnCreation] = useState<WebAuthnCreation>()
  const [webAuthnRequest, setWebAuthnRequest] = useState<WebAuthnRequest>()
  const [tabId, setTabId] = useState<number | undefined>()
  const [credential, setCredential] = useState<WebAuthnRegistration>()
  const [signature, setSignature] = useState<WebAuthnAuthentication>()
  const [port, setPort] = useState<Runtime.Port | null>(null)

  // When a Content Script requests window or tab creation via Service Worker Messaging, passing req.sender.tab.id to the newly created window or tab is recommended. This facilitates sending processed information back to the original Content Script using the specified tabId.
  useEffect(() => {
    const urlParams = window.location.href.split("?")
    const params = objectFromUrlParams(
      urlParams[urlParams.length - 1].replace(window.location.hash, "")
    )
    setTabId(params.tabId ? params.tabId : undefined)
    setWebAuthnCreation({
      user: params.user,
      challenge: params.challengeCreation
    } as WebAuthnCreation)
    setWebAuthnRequest({
      credentialId: params.credentialId,
      challenge: params.challengeRequest
    } as WebAuthnRequest)

    let runtimePort: Runtime.Port
    // The challengeRequest is the only required parameter.
    if (params.challengeRequest) {
      runtimePort = runtime.connect({
        name: PortName.port_requestWebAuthn
      })
    } else {
      runtimePort = runtime.connect({
        name: PortName.port_createWebAuthn
      })
    }
    setPort(runtimePort)
    runtimePort.onMessage.addListener((message) => {
      console.log(
        `[tab][createWebAuthn] runtimePort: ${json.stringify(message, null, 2)}`
      )
    })
    return () => {
      // Disconnect the port
      runtimePort.disconnect()
      // Close this window asynchronously
      window.onbeforeunload = null
      setTimeout(() => {
        window.close()
      }, 100) // After 0.1 seconds
    }
  }, [])

  const buttonCreateWebAuthnViaContents = useCallback(async () => {
    const contentReq = {
      tabId: tabId,
      name: ContentMethod.content_createWebAuthn,
      body: webAuthnCreation
    } as ContentRequestArguments

    // When requesting the Content Script to create a WebAuthn, the response is consistently undefined.
    const contentRes = await sendToContentScript(contentReq) // Always return undefined
    setCredential(contentRes)
  }, [tabId, webAuthnCreation])

  const buttonRequestWebAuthnViaContents = useCallback(async () => {
    const contentReq = {
      tabId: tabId,
      name: ContentMethod.content_requestWebAuthn,
      body: webAuthnRequest
    } as ContentRequestArguments
    console.log(
      `[tab][createWebAuthnViaContents] contentReq: ${json.stringify(
        contentReq,
        null,
        2
      )}`
    )

    // When requesting the Content Script to create a WebAuthn, the response is consistently undefined.
    const contentRes = await sendToContentScript(contentReq) // Always return undefined
    setSignature(contentRes)
  }, [tabId, webAuthnRequest])

  const buttonCreateWebAuthn = useCallback(async () => {
    try {
      const cred = await createWebAuthn(webAuthnCreation)
      // Resolve TypeError: Do not know how to serialize a BigInt
      // Refer: https://github.com/GoogleChromeLabs/jsbi/issues/30
      console.log(
        `[tab][createWebAuthn] credential: ${json.stringify(cred, null, 2)}`
      )
      setCredential(cred)

      // send to background that create this window
      port.postMessage({
        origin: cred.origin,
        credentialId: cred.credentialId,
        publicKey: {
          x: cred.publicKey.x.toString(), // Resolve Uncaught (in promise) Error: Could not serialize message.
          y: cred.publicKey.y.toString() // Resolve Uncaught (in promise) Error: Could not serialize message.
        }
      } as WebAuthnRegistration)
    } catch (error) {
      console.error(`[tab][createWebAuthn] Error: ${error}`)
      port.postMessage({
        error: `[tab][createWebAuthn] Error: ${error}`
      } as WebAuthnError)
    }
  }, [webAuthnCreation, port])

  const buttonRequestWebAuthn = useCallback(async () => {
    try {
      const sig = await requestWebAuthn(
        credential?.credentialId
          ? { ...webAuthnRequest, credentialId: credential.credentialId }
          : webAuthnRequest
      )
      // Resolve TypeError: Do not know how to serialize a BigInt
      // Refer: https://github.com/GoogleChromeLabs/jsbi/issues/30
      console.log(
        `[tab][requestWebAuthn] signature: ${json.stringify(sig, null, 2)}`
      )
      setSignature(sig)

      // send to background that create this window
      port.postMessage({
        authenticatorData: sig.authenticatorData,
        clientDataJson: sig.clientDataJson,
        signature: {
          r: sig.signature.r.toString(), // Resolve Uncaught (in promise) Error: Could not serialize message.
          s: sig.signature.s.toString() // Resolve Uncaught (in promise) Error: Could not serialize message.
        }
      } as WebAuthnAuthentication)
    } catch (error) {
      console.error(`[tab][requestWebAuthn] Error: ${error}`)
      port.postMessage({
        error: `[tab][requestWebAuthn] Error: ${error}`
      } as WebAuthnError)
    }
  }, [webAuthnCreation, credential, port])

  const buttonCloseWindow = useCallback(() => {
    // Disconnect the port
    port.disconnect()
    // Close this window asynchronously
    window.onbeforeunload = null
    setTimeout(() => {
      window.close()
    }, 100) // After 0.1 seconds
  }, [port])

  return (
    <>
      <div>
        <button onClick={buttonCreateWebAuthnViaContents}>
          Create WebAuthn via Contents
        </button>
        <button onClick={buttonRequestWebAuthnViaContents}>
          Request WebAuthn via Contents
        </button>
        <button onClick={buttonCreateWebAuthn}>Create WebAuthn here</button>
        <button onClick={buttonRequestWebAuthn}>Request WebAuthn here</button>
        <button onClick={buttonCloseWindow}>Close Window</button>
      </div>
      {credential === undefined ? (
        <div></div>
      ) : (
        <div>
          <p>WebAuthn credential: {json.stringify(credential, null, 2)}</p>
        </div>
      )}
      {signature === undefined ? (
        <div></div>
      ) : (
        <div>
          <p>WebAuthn signature: {json.stringify(signature, null, 2)}</p>
        </div>
      )}
    </>
  )
}
