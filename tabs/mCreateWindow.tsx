import { useCallback, useEffect, useState } from "react"

import { sendToContentScript } from "@plasmohq/messaging"

import { objectFromUrlParams } from "~tabs/utils/urlObject"

function mCreateWindow() {
  const [count, setCount] = useState(0)
  const [params, setParams] = useState<Record<string, any> | undefined>()
  const [res, setRes] = useState<Record<string, any> | undefined>()

  // fetch params
  useEffect(() => {
    const urlParams = window.location.href.split("?")
    const params = objectFromUrlParams(
      urlParams[urlParams.length - 1].replace(window.location.hash, "")
    )

    setParams(params)
  }, [])

  const buttonCloseWindow = () => {
    window.onbeforeunload = null
    window.close()
  }

  const buttonSendToContentScript = useCallback(async () => {
    console.log(
      `[background][messaging][window] Request: ${JSON.stringify(
        params,
        null,
        2
      )}`
    )
    const resp = await sendToContentScript({
      tabId: params.tabId,
      name: "",
      body: {
        origin: params.origin,
        account: params.account
      }
    })
    setRes(resp)
  }, [params])

  return (
    <>
      <div>
        <p>DApp: {params && params.origin}</p>
        <p>Account: {params && params.account}</p>
        <p>Request Id: {params && params.tabId}</p>
        <p>Response: {JSON.stringify(res, null, 2)}</p>
      </div>
      <div>
        <button onClick={buttonSendToContentScript}>sendToContentScript</button>
        <button onClick={buttonCloseWindow}>Close Window</button>
      </div>
    </>
  )
}

export default mCreateWindow
