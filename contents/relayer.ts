import type { PlasmoCSConfig } from "plasmo"

import { sendToBackground } from "@plasmohq/messaging"
import { relay } from "@plasmohq/messaging/relay"

import { WaalletMessage } from "~packages/provider/waallet/message"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  run_at: "document_start"
}

relay(
  {
    name: "mCreateWindow"
  },
  async (req) => {
    console.log(`[content][relay][mCreateWindow][request]`, req)
    const res = await sendToBackground(req as any)
    console.log(`[content][relay][mCreateWindow][response]`, res)
    return res
  }
)

relay(
  {
    name: WaalletMessage.JsonRpcRequest
  },
  async (req) => {
    console.log(
      `[content][relay][${WaalletMessage.JsonRpcRequest}][request]`,
      req
    )
    const res = await sendToBackground(req as any)
    console.log(
      `[content][relay][${WaalletMessage.JsonRpcRequest}][response]`,
      res
    )
    return res
  }
)
