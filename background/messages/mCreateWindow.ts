import createWindowUrl from "url:~background/messages/mCreateWindow.html"
import { runtime, windows } from "webextension-polyfill"

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
  console.log(`req.body.params: ${req.body.params}`)

  await windows.create({
    url: createWindowUrl,
    focused: true,
    type: "popup",
    width: 385,
    height: 720
  })

  res.send({
    out: `Opened: ${createWindowUrl}`
  })
}

export default handler
