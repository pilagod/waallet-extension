import {
  runtime,
  tabs,
  windows,
  type Tabs,
  type Windows
} from "webextension-polyfill"

import { type PlasmoMessaging } from "@plasmohq/messaging"

export type RequestBody = {
  method: string
  params: [
    {
      origin: string
      account: string
    }
  ]
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
    "tabs/mCreateWindow.html"
  )}?origin=${req.body.params?.[0].origin}&account=${req.body.params?.[0]
    .account}&tabId=${req.sender.tab.id}`

  const window = await createWindowAsync(createWindowUrl)
  console.log(
    `[background][messaging][window] window: ${JSON.stringify(window, null, 2)}`
  )

  //   const tab = await createTabAsync(createWindowUrl)
  //   console.log(
  //     `[background][messaging][window] tab: ${JSON.stringify(window, null, 2)}`
  //   )

  res.send({
    out: `Opened: ${createWindowUrl}`
  })
}

function createWindowAsync(createWindowUrl: string) {
  return new Promise((resolve, reject) => {
    let createdWindow = null
    windows
      .create({
        url: createWindowUrl,
        focused: true,
        type: "popup",
        width: 385,
        height: 720
      })
      .then((window) => {
        createdWindow = window
      })
      .catch((error) => {
        reject(error)
      })

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
  return new Promise((resolve, reject) => {
    let createdTab = null
    const tab = tabs
      .create({
        url: createTabUrl
      })
      .then((tab) => {
        createdTab = tab
      })
      .catch((error) => {
        reject(error)
      })

    const removedListener = (removedTabId: number) => {
      if (removedTabId === createdTab.id) {
        tabs.onRemoved.removeListener(removedListener)
        resolve(tab)
      }
    }
    tabs.onRemoved.addListener(removedListener)
  })
}

export default handler
