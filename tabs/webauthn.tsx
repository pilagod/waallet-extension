import { useCallback, useEffect, useState } from "react"
import { runtime, type Runtime } from "webextension-polyfill"

import { sendToContentScript } from "@plasmohq/messaging"

import {
  ContentMethod,
  type ContentRequestArguments
} from "~packages/account/PasskeyAccount/passkeyOwnerWebauthn/content/method"
import { PortName } from "~packages/account/PasskeyAccount/passkeyOwnerWebauthn/tabs/port"
import {
  createWebauthn,
  requestWebauthn
} from "~packages/account/PasskeyAccount/passkeyOwnerWebauthn/webauthn"
import type {
  WebauthnAuthentication,
  WebauthnCreation,
  WebauthnRegistration,
  WebauthnRequest
} from "~packages/account/PasskeyAccount/passkeyOwnerWebauthn/webauthn/typing"
import { objectFromUrlParams } from "~packages/util/url"
import type { UrlB64String } from "~typing"

export const Webauthn = () => {
  const [webauthnCreation, setWebauthnCreation] = useState<WebauthnCreation>()
  const [webauthnRequest, setWebauthnRequest] = useState<WebauthnRequest>()
  const [tabId, setTabId] = useState<number | undefined>()
  const [cred, setCred] = useState<WebauthnRegistration>()
  // Record the latest Credential ID for signing in future WebAuthn requests.
  const [credId, setCredId] = useState<UrlB64String>("")
  const [sig, setSig] = useState<WebauthnAuthentication>()
  const [port, setPort] = useState<Runtime.Port | null>(null)

  // When a Content Script requests window or tab creation via Service Worker Messaging, passing req.sender.tab.id to the newly created window or tab is recommended. This facilitates sending processed information back to the original Content Script using the specified tabId.
  useEffect(() => {
    const urlParams = window.location.href.split("?")
    const params = objectFromUrlParams(
      urlParams[urlParams.length - 1].replace(window.location.hash, "")
    )
    setTabId(params.tabId ? params.tabId : undefined)
    setWebauthnCreation({
      user: params.user,
      challenge: params.challengeCreation
    } as WebauthnCreation)
    setWebauthnRequest({
      credentialId: params.credentialId,
      challenge: params.challengeRequest
    } as WebauthnRequest)

    const runtimePort = runtime.connect({
      name: PortName.port_createWebauthn
    })
    setPort(runtimePort)
    runtimePort.onMessage.addListener((message) => {
      console.log(
        `[tab][createWebauthn] runtimePort: ${JSON.stringify(message, null, 2)}`
      )
    })
    return () => {
      runtimePort.disconnect()
    }
  }, [])

  const buttonCreateWebauthnViaContents = useCallback(async () => {
    const contentReq = {
      tabId: tabId,
      name: ContentMethod.content_createWebauthn,
      body: webauthnCreation
    } as ContentRequestArguments

    // When requesting the Content Script to create a WebAuthn, the response is consistently undefined.
    const contentRes = await sendToContentScript(contentReq) // Always return undefined
    setCred(contentRes)
  }, [tabId, webauthnCreation])

  const buttonRequestWebauthnViaContents = useCallback(async () => {
    const contentReq = {
      tabId: tabId,
      name: ContentMethod.content_requestWebauthn,
      body: credId
        ? { ...webauthnRequest, credentialId: credId }
        : webauthnRequest
    } as ContentRequestArguments
    console.log(
      `[tab][createWebauthnViaContents] contentReq: ${JSON.stringify(
        contentReq,
        null,
        2
      )}`
    )

    // When requesting the Content Script to create a WebAuthn, the response is consistently undefined.
    const contentRes = await sendToContentScript(contentReq) // Always return undefined
    setSig(contentRes)
  }, [tabId, credId, webauthnRequest])

  const buttonCreateWebauthn = useCallback(async () => {
    try {
      const credential = await createWebauthn(webauthnCreation)
      // Resolve TypeError: Do not know how to serialize a BigInt
      // Refer: https://github.com/GoogleChromeLabs/jsbi/issues/30
      console.log(
        `[tab][createWebauthn] credential: ${JSON.stringify(
          credential,
          (_, value) => {
            return typeof value === "bigint" ? value.toString() : value
          },
          2
        )}`
      )
      setCred(credential)

      // send to background that create this window
      port.postMessage({
        origin: credential.origin,
        credentialId: credential.credentialId,
        publicKeyX: credential.publicKeyX.toString(), // Resolve Uncaught (in promise) Error: Could not serialize message.
        publicKeyY: credential.publicKeyY.toString() // Resolve Uncaught (in promise) Error: Could not serialize message.
      } as WebauthnRegistration)
    } catch (error) {
      console.error("Error creating webauthn:", error)
    }
  }, [webauthnCreation, port])

  const buttonRequestWebauthn = useCallback(async () => {
    try {
      const signature = await requestWebauthn(
        cred?.credentialId
          ? { ...webauthnRequest, credentialId: cred.credentialId }
          : webauthnRequest
      )
      // Resolve TypeError: Do not know how to serialize a BigInt
      // Refer: https://github.com/GoogleChromeLabs/jsbi/issues/30
      console.log(
        `[tab][requestWebauthn] signature: ${JSON.stringify(
          signature,
          (_, value) => {
            return typeof value === "bigint" ? value.toString() : value
          },
          2
        )}`
      )
      setSig(signature)

      // send to background that create this window
      port.postMessage({
        authenticatorData: signature.authenticatorData,
        clientDataJson: signature.clientDataJson,
        sigantureR: signature.sigantureR.toString(), // Resolve Uncaught (in promise) Error: Could not serialize message.
        signatureS: signature.signatureS.toString() // Resolve Uncaught (in promise) Error: Could not serialize message.
      } as WebauthnAuthentication)
    } catch (error) {
      console.error("Error requesting webauthn:", error)
    }
  }, [webauthnCreation, cred, port])

  const buttonCloseWindow = () => {
    window.onbeforeunload = null
    window.close()
  }

  return (
    <>
      <div>
        <button onClick={buttonCreateWebauthnViaContents}>
          Create Webauthn via Contents
        </button>
        <button onClick={buttonRequestWebauthnViaContents}>
          Request Webauthn via Contents
        </button>
        <button onClick={buttonCreateWebauthn}>Create Webauthn here</button>
        <button onClick={buttonRequestWebauthn}>Request Webauthn here</button>
        <button onClick={buttonCloseWindow}>Close Window</button>
      </div>
      {cred === undefined ? (
        <div></div>
      ) : (
        <div>
          <p>
            Webauthn credential:{" "}
            {JSON.stringify(
              cred,
              (_, value) => {
                return typeof value === "bigint" ? value.toString() : value
              },
              2
            )}
          </p>
        </div>
      )}
      {sig === undefined ? (
        <div></div>
      ) : (
        <div>
          <p>
            Webauthn signature:{" "}
            {JSON.stringify(
              sig,
              (_, value) => {
                return typeof value === "bigint" ? value.toString() : value
              },
              2
            )}
          </p>
        </div>
      )}
    </>
  )
}

export default Webauthn
