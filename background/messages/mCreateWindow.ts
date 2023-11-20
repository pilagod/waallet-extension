import createWindowUrl from "url:~background/messages/mCreateWindow.html"
import { windows } from "webextension-polyfill"

import { type PlasmoMessaging } from "@plasmohq/messaging"

export type RequestBody = {
  in: string
}

export type ResponseBody = {
  out: string
}

const handler: PlasmoMessaging.MessageHandler<
  RequestBody,
  ResponseBody
> = async (req, res) => {
  console.log(`[background][messaging][window] Request: ${JSON.stringify(req)}`)

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
