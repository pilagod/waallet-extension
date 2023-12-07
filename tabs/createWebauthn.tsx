import { useCallback, useEffect, useState, type DependencyList } from "react"

import { sendToContentScript } from "@plasmohq/messaging"

import {
  ContentMethod,
  handleCreateWebauthn,
  type ContentRequestArguments
} from "~contents/messages"
import * as UrlObject from "~tabs/utils/urlObject"

export const CreateWebauthn = () => {
  const [tabParams, setTabParams] = useState<Record<string, any> | undefined>()
  const [cred, setCred] = useState<Record<string, any> | undefined>()

  // When a Content Script requests window or tab creation via Service Worker Messaging, passing req.sender.tab.id to the newly created window or tab is recommended. This facilitates sending processed information back to the original Content Script using the specified tabId.
  useEffect(() => {
    const urlParams = window.location.href.split("?")
    const params = UrlObject.objectFromUrlParams(
      urlParams[urlParams.length - 1].replace(window.location.hash, "")
    )
    setTabParams(params)
  }, [])

  const buttonCreateWebauthnViaContentsDeps: DependencyList = [tabParams]
  const buttonCreateWebauthnViaContents = useCallback(async () => {
    const tabId = tabParams.tabId ? tabParams.tabId : undefined
    const contentReq = {
      tabId: tabId,
      name: "",
      body: {
        method: ContentMethod.content_createWebauthn,
        params: tabParams
      } as ContentRequestArguments
    }
    // When requesting the Content Script to create a WebAuthn, the response is consistently undefined.
    const contentRes = await sendToContentScript(contentReq)

    console.log(
      `[tab][createWebauthnViaContents] contentRes: ${JSON.stringify(
        contentRes,
        null,
        2
      )}`
    )
    setCred(contentRes)
  }, buttonCreateWebauthnViaContentsDeps)

  const buttonCreateWebauthnDeps: DependencyList = [tabParams]
  const buttonCreateWebauthn = useCallback(async () => {
    const credential = await handleCreateWebauthn(tabParams)

    console.log(
      `[tab][createWebauthn] contentRes: ${JSON.stringify(credential, null, 2)}`
    )
    setCred(credential)
  }, buttonCreateWebauthnDeps)

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
        <button onClick={buttonCreateWebauthn}>Create Webauthn here</button>
        <button onClick={buttonCloseWindow}>Close Window</button>
      </div>
      {cred === undefined ? (
        <div></div>
      ) : (
        <div>
          <p>Webauthn credential: {JSON.stringify(cred, null, 2)}</p>
        </div>
      )}
    </>
  )
}

export default CreateWebauthn
