import { runtime, tabs, windows } from "webextension-polyfill"

import { type PlasmoMessaging } from "@plasmohq/messaging"

export type RequestBody = {
  user?: string
  chalBase64Url?: string
  authAttach?: AuthenticatorAttachment
}

export type ResponseBody = {
  out: string
}

const handler: PlasmoMessaging.MessageHandler<
  RequestBody,
  ResponseBody
> = async (req, res) => {
  console.log(
    `[background][messaging][window] Request: ${JSON.stringify(req, null, 2)}`
  )

  const createWindowUrl = `${runtime.getURL(
    "tabs/createWebauthn.html"
  )}?tabId=${req.sender.tab.id}&user=${encodeURI(
    req.body.user
  )}&chalBase64Url=${req.body.chalBase64Url}&authAttach=${req.body.authAttach}`
  console.log(`createWindowUrl: ${createWindowUrl}`)

  const window = await createWindowAsync(createWindowUrl, req.sender.tab.id)
  console.log(
    `[background][messaging][window] window: ${JSON.stringify(window, null, 2)}`
  )

  //   const tab = await createTabAsync(createWindowUrl)
  //   console.log(
  //     `[background][messaging][tab] tab: ${JSON.stringify(window, null, 2)}`
  //   )

  res.send({
    out: `Opened: ${createWindowUrl}`
  })
}

function createWindowAsync(createWindowUrl: string, tabId: number) {
  return new Promise(async (resolve, reject) => {
    let createdWindow = null
    try {
      createdWindow = await windows.create({
        url: createWindowUrl,
        focused: true,
        type: "popup",
        width: 480,
        height: 720
      })
    } catch (e) {
      reject(e)
      return
    }

    const removedListener = (removedWindowId: number) => {
      if (removedWindowId === createdWindow.id) {
        windows.onRemoved.removeListener(removedListener)
        resolve(createdWindow)
      }
    }
    windows.onRemoved.addListener(removedListener)
  })
}

function createTabAsync(createTabUrl: string) {
  return new Promise(async (resolve, reject) => {
    let createdTab = null
    try {
      createdTab = await tabs.create({
        url: createTabUrl,
        active: false
      })
    } catch (e) {
      reject(e)
      return
    }

    const removedListener = (removedTabId: number) => {
      if (removedTabId === createdTab.id) {
        tabs.onRemoved.removeListener(removedListener)
        resolve(createdTab)
      }
    }
    tabs.onRemoved.addListener(removedListener)
  })
}

export default handler
